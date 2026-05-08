/**
 * Phase A — Order/Upgrade business logic.
 *
 * Orders move through these states:
 *   pending      — user created, slip uploaded, awaiting admin review
 *   confirmed    — admin confirmed, plan applied, license issued
 *   rejected     — admin rejected (with reason)
 *   cancelled    — user cancelled (rare)
 *
 * On confirm we:
 *   1. Update users.plan + users.plan_expires_at (online tier tracking)
 *   2. For yearly/lifetime: generate signed license.dat (offline), save to
 *      `licenses` table, attach the JSON in the order row's notes field for
 *      the email step.
 *   3. Mark order completed.
 *
 * Plan validity is a single source of truth defined here:
 */
const crypto = require('crypto');
const { getDb } = require('./feedbackDb');
const licenseSigner = require('./licenseSigner');

// Valid days per plan (canonical):
//   Yearly  = 365 days + 90-day promo bonus = 455 days
//   Lifetime ≈ 100 years (effectively forever)
//   Monthly = 30 days (online-verified, no license.dat)
const PLAN_VALIDITY_DAYS = {
    monthly:  30,
    yearly:   455,
    lifetime: 36500,
};

// Pricing in THB — kept in sync with website/src/app/[locale]/pricing/page.tsx
const PLAN_AMOUNT_THB = {
    monthly:  445,
    yearly:   4450,
    lifetime: 26700,
};

// Plans that get an offline license.dat after admin confirm.
const PLANS_WITH_DAT = new Set(['yearly', 'lifetime']);

function isValidPlan(plan) {
    return Object.prototype.hasOwnProperty.call(PLAN_VALIDITY_DAYS, plan);
}

/**
 * Create a pending order. Caller already authenticated.
 * Returns { ok: true, order } or throws on bad input.
 */
function createOrder({ userId, plan, slipPath, paymentRef, notes, hardwareId }) {
    if (!userId) throw new Error('missing_user');
    const planLc = String(plan || '').toLowerCase();
    if (!isValidPlan(planLc)) throw new Error('invalid_plan');
    const amount = PLAN_AMOUNT_THB[planLc];
    if (!amount) throw new Error('amount_not_configured');

    const db = getDb();
    const now = Date.now();
    const result = db.prepare(`
        INSERT INTO orders (user_id, plan, amount, currency, status, payment_method, slip_path, payment_ref, hardware_id, created_at, notes)
        VALUES (?, ?, ?, 'THB', 'pending', 'promptpay', ?, ?, ?, ?, ?)
    `).run(userId, planLc, amount, slipPath || null, paymentRef || null, hardwareId || null, now, notes || null);
    return getOrder(result.lastInsertRowid);
}

function getOrder(orderId) {
    const db = getDb();
    return db.prepare(`
        SELECT o.*, u.email AS user_email, u.name AS user_name
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE o.id = ?
    `).get(orderId);
}

function listUserOrders(userId) {
    const db = getDb();
    return db.prepare(`
        SELECT id, plan, amount, currency, status, slip_path, payment_ref, created_at, confirmed_at, notes
        FROM orders WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 200
    `).all(userId);
}

function listOrders({ status = null, limit = 100, offset = 0 } = {}) {
    const db = getDb();
    const where = status ? 'WHERE o.status = ?' : '';
    const params = status ? [status, limit, offset] : [limit, offset];
    return db.prepare(`
        SELECT o.id, o.user_id, u.email AS user_email, u.name AS user_name,
               o.plan, o.amount, o.currency, o.status, o.slip_path, o.payment_ref,
               o.created_at, o.confirmed_at, o.notes
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        ${where}
        ORDER BY
          CASE o.status WHEN 'pending' THEN 0 ELSE 1 END,
          o.created_at DESC
        LIMIT ? OFFSET ?
    `).all(...params);
}

/**
 * Confirm a pending order. Idempotent: returns existing license if already
 * confirmed.
 *
 * Generates a license.dat for yearly/lifetime, binding to the user's most-recent
 * non-revoked device_token's hardware_id. If the user has never signed in via
 * web (no device), the license is issued with an empty HW ID and the desktop's
 * licenseManager will reject it — caller should warn the admin.
 */
function confirmOrder({ orderId, adminUserId }) {
    if (!orderId) throw new Error('missing_order');
    const db = getDb();
    const order = getOrder(orderId);
    if (!order) throw new Error('order_not_found');
    const planLc = String(order.plan).toLowerCase();
    if (order.status === 'confirmed') {
        // Idempotent — find the most recent active license for this user+plan
        const lic = db.prepare(`
            SELECT * FROM licenses
            WHERE user_id = ? AND plan = ? AND revoked = 0
            ORDER BY created_at DESC LIMIT 1
        `).get(order.user_id, planLc);
        return { ok: true, order, license: lic, alreadyConfirmed: true };
    }
    if (order.status !== 'pending') throw new Error(`cannot_confirm_${order.status}`);

    const validDays = PLAN_VALIDITY_DAYS[planLc];
    if (!validDays) throw new Error('invalid_plan');
    const now = Date.now();
    const expiresAt = (planLc === 'lifetime') ? null : (now + validDays * 86400000);

    // 1. Apply plan to user
    db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?')
        .run(planLc, expiresAt, order.user_id);

    // 2. For paid offline plans: generate license.dat
    let license = null;
    if (PLANS_WITH_DAT.has(planLc)) {
        // Hardware ID priority:
        //   1. order.hardware_id (user provided at checkout — most explicit)
        //   2. user's most-recent device_token hardware_id (signed-in device)
        //   3. empty string (will fail HW check on Desktop until user re-issues)
        let hwId = (order.hardware_id || '').trim();
        if (!hwId) {
            const dt = db.prepare(`
                SELECT hardware_id FROM device_tokens
                 WHERE user_id = ? AND revoked = 0 AND hardware_id IS NOT NULL
                 ORDER BY last_used_at DESC, created_at DESC
                 LIMIT 1
            `).get(order.user_id);
            hwId = dt?.hardware_id || '';
        }

        const licenseKey = licenseSigner.generateLicenseKey();
        const datJson = licenseSigner.buildAndSign({
            userId:      order.user_id,
            userEmail:   order.user_email,
            plan:        planLc,
            hardwareId:  hwId,
            validDays,
            licenseKey,
        });

        const validFrom = now;
        const validUntil = (planLc === 'lifetime') ? (now + validDays * 86400000) : expiresAt;

        const result = db.prepare(`
            INSERT INTO licenses (user_id, license_key, plan, hardware_id, valid_from, valid_until, revoked, license_dat_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
        `).run(order.user_id, licenseKey, planLc, hwId, validFrom, validUntil, JSON.stringify(datJson), now);
        license = db.prepare('SELECT * FROM licenses WHERE id = ?').get(result.lastInsertRowid);
    }

    // 3. Mark order confirmed
    db.prepare(`
        UPDATE orders
           SET status = 'confirmed',
               confirmed_at = ?,
               confirmed_by = ?
         WHERE id = ?
    `).run(now, adminUserId || null, orderId);

    return { ok: true, order: getOrder(orderId), license };
}

function rejectOrder({ orderId, adminUserId, reason }) {
    if (!orderId) throw new Error('missing_order');
    const db = getDb();
    const order = getOrder(orderId);
    if (!order) throw new Error('order_not_found');
    if (order.status !== 'pending') throw new Error(`cannot_reject_${order.status}`);
    db.prepare(`
        UPDATE orders
           SET status = 'rejected',
               confirmed_at = ?,
               confirmed_by = ?,
               notes = COALESCE(NULLIF(notes,''), '') || (CASE WHEN notes IS NOT NULL AND notes <> '' THEN ' | ' ELSE '' END) || ?
         WHERE id = ?
    `).run(Date.now(), adminUserId || null, `REJECTED: ${reason || 'no reason given'}`, orderId);
    return { ok: true, order: getOrder(orderId) };
}

/**
 * Compute the new valid_until ms for a license renewal/issuance.
 *   - newPlan === 'lifetime'                  → returns null (forever)
 *   - existingLicense is lifetime + !force    → throws 'user_already_lifetime'
 *   - else                                    → now + (planDays + remainingDays)*86400000
 *
 * `existingLicense` is the most-recent active license row for the user, or null.
 * Pre-expired remaining days clamp to 0.
 */
function computeRenewalValidUntil({ existingLicense, newPlan, force = false, now = Date.now() }) {
    const planLc = String(newPlan || '').toLowerCase();
    if (!isValidPlan(planLc)) throw new Error('invalid_plan');

    // Promoting to lifetime always wins
    if (planLc === 'lifetime') {
        return { validUntilMs: null, remainingDays: 0, planDays: PLAN_VALIDITY_DAYS.lifetime, isLifetime: true };
    }

    // Block downgrade from lifetime unless force
    if (existingLicense && existingLicense.revoked === 0 && existingLicense.plan === 'lifetime') {
        if (!force) {
            const e = new Error('user_already_lifetime');
            e.code = 'user_already_lifetime';
            throw e;
        }
        // force=true → fall through and treat as fresh issuance
    }

    const planDays = PLAN_VALIDITY_DAYS[planLc];
    let remainingDays = 0;
    if (existingLicense && existingLicense.revoked === 0 && existingLicense.valid_until) {
        const remainingMs = existingLicense.valid_until - now;
        remainingDays = Math.max(0, Math.ceil(remainingMs / 86400000));
    }
    const totalDays = planDays + remainingDays;
    return {
        validUntilMs: now + totalDays * 86400000,
        remainingDays,
        planDays,
        totalDays,
        isLifetime: false,
    };
}

/**
 * Issue a license directly without an order. Used by /api/admin/license/generate.
 * Caller must already have admin auth.
 *
 * Steps:
 *   1. Resolve user (user_id or user_email — must exist)
 *   2. Reject 'monthly' (online-only by design)
 *   3. Find latest active license (revoked=0) for user
 *   4. Compute new valid_until via renewal logic
 *   5. Generate license_key + sign payload
 *   6. INSERT new licenses row
 *   7. Mark prior license revoked='superseded' (preserve audit trail)
 *   8. UPDATE users.plan + plan_expires_at
 *
 * Returns { license, license_dat_json, supersededLicense, daysAdded, totalDays, validUntilMs }
 */
function issueLicenseDirect({ userId, userEmail, plan, hardwareId, adminUserId, notes, force }) {
    const planLc = String(plan || '').toLowerCase();
    if (planLc === 'monthly') throw new Error('monthly_not_supported_for_license_dat');
    if (!PLANS_WITH_DAT.has(planLc)) throw new Error('invalid_plan');
    if (!hardwareId || typeof hardwareId !== 'string' || hardwareId.length < 8) {
        throw new Error('missing_hardware_id');
    }

    const db = getDb();

    // Resolve user
    let user = null;
    if (userId) {
        user = db.prepare('SELECT id, email, name, plan FROM users WHERE id = ?').get(userId);
    } else if (userEmail) {
        user = db.prepare('SELECT id, email, name, plan FROM users WHERE email = ?').get(String(userEmail).toLowerCase().trim());
    }
    if (!user) throw new Error('user_not_found');

    // Latest active license for this user (any HW)
    const existingLicense = db.prepare(`
        SELECT id, plan, hardware_id, valid_until, revoked
        FROM licenses
        WHERE user_id = ? AND revoked = 0
        ORDER BY created_at DESC LIMIT 1
    `).get(user.id);

    const renewal = computeRenewalValidUntil({ existingLicense, newPlan: planLc, force });

    // Build + sign new license.dat
    // For lifetime we use PLAN_VALIDITY_DAYS.lifetime (~100 yr) so signed expiry exists
    const validDays = renewal.isLifetime
        ? PLAN_VALIDITY_DAYS.lifetime
        : Math.max(1, Math.ceil((renewal.validUntilMs - Date.now()) / 86400000));
    const licenseKey = require('./licenseSigner').generateLicenseKey();
    const datJson = require('./licenseSigner').buildAndSign({
        userId: user.id,
        userEmail: user.email,
        plan: planLc,
        hardwareId,
        validDays,
        licenseKey,
    });

    const now = Date.now();
    const validFrom = now;
    const validUntil = renewal.isLifetime ? (now + validDays * 86400000) : renewal.validUntilMs;

    // Insert new license + supersede the old one in a single transaction
    const tx = db.transaction(() => {
        const result = db.prepare(`
            INSERT INTO licenses (user_id, license_key, plan, hardware_id, valid_from, valid_until, revoked, license_dat_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
        `).run(user.id, licenseKey, planLc, hardwareId, validFrom, validUntil, JSON.stringify(datJson), now);

        let supersededLicense = null;
        if (existingLicense) {
            db.prepare(`
                UPDATE licenses
                   SET revoked = 1
                 WHERE id = ?
            `).run(existingLicense.id);
            supersededLicense = existingLicense;
        }

        // Update user plan + expires_at (null for lifetime)
        const userPlanExpiresAt = renewal.isLifetime ? null : validUntil;
        db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?')
            .run(planLc, userPlanExpiresAt, user.id);

        return {
            license: db.prepare('SELECT * FROM licenses WHERE id = ?').get(result.lastInsertRowid),
            supersededLicense,
        };
    });
    const { license, supersededLicense } = tx();

    return {
        license,
        license_dat_json: datJson,
        supersededLicense,
        daysAdded: renewal.planDays,
        remainingDays: renewal.remainingDays,
        totalDays: renewal.totalDays,
        validUntilMs: renewal.isLifetime ? null : validUntil,
        isLifetime: renewal.isLifetime,
    };
}

/** Mark a license revoked (admin action). */
function revokeLicense({ licenseId, adminUserId, reason }) {
    if (!licenseId) throw new Error('missing_license_id');
    const db = getDb();
    const lic = db.prepare('SELECT * FROM licenses WHERE id = ?').get(licenseId);
    if (!lic) throw new Error('license_not_found');
    if (lic.revoked) throw new Error('already_revoked');
    db.prepare('UPDATE licenses SET revoked = 1 WHERE id = ?').run(licenseId);
    // Best-effort: clear users.plan_expires_at if this was their active license
    try {
        const stillActive = db.prepare(`
            SELECT id FROM licenses WHERE user_id = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 1
        `).get(lic.user_id);
        if (!stillActive) {
            db.prepare('UPDATE users SET plan = ?, plan_expires_at = NULL WHERE id = ?').run('free', lic.user_id);
        }
    } catch (_) {}
    return { ok: true, license: db.prepare('SELECT * FROM licenses WHERE id = ?').get(licenseId) };
}

module.exports = {
    PLAN_VALIDITY_DAYS,
    PLAN_AMOUNT_THB,
    PLANS_WITH_DAT,
    isValidPlan,
    createOrder,
    getOrder,
    listUserOrders,
    listOrders,
    confirmOrder,
    rejectOrder,
    computeRenewalValidUntil,
    issueLicenseDirect,
    revokeLicense,
};
