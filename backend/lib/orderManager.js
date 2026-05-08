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
function createOrder({ userId, plan, slipPath, paymentRef, notes }) {
    if (!userId) throw new Error('missing_user');
    const planLc = String(plan || '').toLowerCase();
    if (!isValidPlan(planLc) || planLc === 'monthly') {
        // Monthly is allowed too, but only via this same flow.
    }
    if (!isValidPlan(planLc)) throw new Error('invalid_plan');
    const amount = PLAN_AMOUNT_THB[planLc];
    if (!amount) throw new Error('amount_not_configured');

    const db = getDb();
    const now = Date.now();
    const result = db.prepare(`
        INSERT INTO orders (user_id, plan, amount, currency, status, payment_method, slip_path, payment_ref, created_at, notes)
        VALUES (?, ?, ?, 'THB', 'pending', 'promptpay', ?, ?, ?, ?)
    `).run(userId, planLc, amount, slipPath || null, paymentRef || null, now, notes || null);
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
        // Pull most-recent device_token hardware_id (best-effort)
        const dt = db.prepare(`
            SELECT hardware_id FROM device_tokens
             WHERE user_id = ? AND revoked = 0 AND hardware_id IS NOT NULL
             ORDER BY last_used_at DESC, created_at DESC
             LIMIT 1
        `).get(order.user_id);
        const hwId = dt?.hardware_id || '';

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
};
