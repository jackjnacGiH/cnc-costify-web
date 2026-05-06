/**
 * Desktop ↔ Web link + quota helpers.
 *
 * Auth-link flow (OAuth-style device authorization, single-roundtrip):
 *   1. Desktop calls POST /api/desktop/auth-link/start  → returns {code, expires_in}
 *   2. Desktop opens browser → https://www.cnccostify.cloud/{locale}/desktop-auth?code=XYZ
 *   3. User (logged in via cookie) clicks "Authorize" → POST /api/desktop/auth-link/confirm
 *   4. Server attaches user_id to the code row, generates device_token, stores hash
 *   5. Desktop polls GET /api/desktop/auth-link/exchange?code=XYZ until 200
 *   6. Server returns the (one-time) device_token + user; consumes the code
 *
 * Quota:
 *   - dayKey = YYYY-MM-DD in Asia/Bangkok (UTC+7)
 *   - Free plan: max 3 files/day total (step/pdf/jpg combined)
 *   - Paid plans (monthly/yearly/lifetime): unlimited (-1)
 */
const crypto = require('crypto');
const { getDb } = require('./feedbackDb');

const FREE_DAILY_LIMIT = 3;
const AUTH_LINK_TTL_MS = 5 * 60 * 1000;   // 5 minutes
const DEVICE_TOKEN_BYTES = 32;             // 256-bit
const TH_OFFSET_MS = 7 * 60 * 60 * 1000;   // UTC+7

function _hash(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function _generateCode() {
    // URL-safe alphanumeric, 12 chars (~71 bits entropy)
    return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

function _generateDeviceToken() {
    // Prefix lets us identify in logs; payload is base64url
    return 'cnc_' + crypto.randomBytes(DEVICE_TOKEN_BYTES).toString('base64url');
}

/** dayKey for "now" in Asia/Bangkok timezone, format YYYY-MM-DD. */
function getThDayKey(nowMs = Date.now()) {
    const th = new Date(nowMs + TH_OFFSET_MS);
    const y = th.getUTCFullYear();
    const m = String(th.getUTCMonth() + 1).padStart(2, '0');
    const d = String(th.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** ms until next 00:00 Asia/Bangkok. */
function msUntilThMidnight(nowMs = Date.now()) {
    const thNow = nowMs + TH_OFFSET_MS;
    const dayMs = 24 * 60 * 60 * 1000;
    const msIntoDay = thNow % dayMs;
    return dayMs - msIntoDay;
}

// ─── Auth-link flow ──────────────────────────────────────────────────────

/** Step 1: desktop starts the link flow. Includes hardware_id for binding. */
function startAuthLink({ os, appVersion, deviceName, hardwareId }) {
    const db = getDb();
    const code = _generateCode();
    const now = Date.now();
    db.prepare(`
        INSERT INTO auth_link_codes (code, user_id, device_token, hardware_id, os, app_version, device_name, created_at, expires_at, consumed)
        VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, ?, 0)
    `).run(code, hardwareId || null, os || null, appVersion || null, deviceName || null, now, now + AUTH_LINK_TTL_MS);
    return { code, expiresIn: Math.floor(AUTH_LINK_TTL_MS / 1000) };
}

/** Read code metadata (for the /desktop-auth confirm page to display HW ID, etc.). */
function getAuthLinkInfo(code) {
    if (!code) return null;
    const db = getDb();
    const row = db.prepare(`
        SELECT code, user_id, hardware_id, os, app_version, device_name, created_at, expires_at, consumed
        FROM auth_link_codes WHERE code = ?
    `).get(code);
    if (!row) return null;
    return {
        ...row,
        expired: Date.now() > row.expires_at,
        authorized: !!row.user_id,
    };
}

/** Step 3: web confirms (called by /desktop-auth page after user clicks "Authorize"). */
function confirmAuthLink({ code, userId, ip }) {
    if (!code || !userId) throw new Error('invalid_input');
    const db = getDb();
    const row = db.prepare('SELECT * FROM auth_link_codes WHERE code = ?').get(code);
    if (!row) throw new Error('code_not_found');
    if (row.consumed) throw new Error('code_already_used');
    if (Date.now() > row.expires_at) throw new Error('code_expired');
    if (row.user_id) throw new Error('code_already_authorized');

    const token = _generateDeviceToken();
    const tokenHash = _hash(token);
    const now = Date.now();
    const hwId = row.hardware_id || null;

    // If THIS user already has an active token bound to THIS hardware_id,
    // revoke the old one so 1 HW = 1 active token (matches license.dat semantics).
    let revokedPrior = 0;
    if (hwId) {
        revokedPrior = db.prepare(`
            UPDATE device_tokens
               SET revoked = 1, revoked_reason = 'rebound'
             WHERE user_id = ? AND hardware_id = ? AND revoked = 0
        `).run(userId, hwId).changes;
    }

    // Insert new device_tokens row (bound to HW ID)
    const dtRes = db.prepare(`
        INSERT INTO device_tokens (user_id, token_hash, hardware_id, device_name, os, app_version, created_at, last_used_at, last_ip, revoked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(userId, tokenHash, hwId, row.device_name, row.os, row.app_version, now, now, ip || null);

    // Attach to code row (token kept plaintext briefly until desktop exchanges it)
    db.prepare('UPDATE auth_link_codes SET user_id = ?, device_token = ? WHERE code = ?')
        .run(userId, token, code);

    return { ok: true, deviceTokenId: dtRes.lastInsertRowid, revokedPrior };
}

/** Step 5: desktop polls/exchanges to get the token. One-shot. */
function exchangeAuthLink(code) {
    if (!code) throw new Error('invalid_input');
    const db = getDb();
    const row = db.prepare('SELECT * FROM auth_link_codes WHERE code = ?').get(code);
    if (!row) throw new Error('code_not_found');
    if (Date.now() > row.expires_at) throw new Error('code_expired');
    if (!row.user_id || !row.device_token) {
        // Not yet authorized — desktop should keep polling
        return { ok: false, status: 'pending' };
    }
    if (row.consumed) throw new Error('code_already_used');

    // Mark consumed + clear plaintext token from code row
    db.prepare('UPDATE auth_link_codes SET consumed = 1, device_token = NULL WHERE code = ?').run(code);

    // Lookup user (sans password fields)
    const user = db.prepare('SELECT id, email, name, plan, role, verified, created_at FROM users WHERE id = ?')
        .get(row.user_id);

    return { ok: true, status: 'authorized', token: row.device_token, user };
}

/** Cleanup expired codes (idempotent). */
function cleanupExpiredCodes() {
    const db = getDb();
    return db.prepare('DELETE FROM auth_link_codes WHERE expires_at < ?').run(Date.now()).changes;
}

// ─── Device token validation ─────────────────────────────────────────────

/**
 * Look up a device token; return {user, deviceTokenId, hardwareId} or null.
 *
 * If `expectedHardwareId` is provided, returns null when it doesn't match the
 * binding stored at confirm time (1-HW-per-token enforcement).
 */
function validateDeviceToken(token, ip, expectedHardwareId) {
    if (!token) return null;
    const db = getDb();
    const tokenHash = _hash(token);
    const dt = db.prepare(`
        SELECT id, user_id, hardware_id, revoked FROM device_tokens WHERE token_hash = ?
    `).get(tokenHash);
    if (!dt || dt.revoked) return null;
    if (expectedHardwareId && dt.hardware_id) {
        const want = String(expectedHardwareId).trim().toLowerCase();
        const have = String(dt.hardware_id).trim().toLowerCase();
        if (want !== have) return null; // hardware mismatch
    }
    const user = db.prepare(
        'SELECT id, email, name, plan, role, verified, created_at FROM users WHERE id = ?'
    ).get(dt.user_id);
    if (!user) return null;
    // Update last-used (best-effort; do NOT throw if it fails)
    try {
        db.prepare('UPDATE device_tokens SET last_used_at = ?, last_ip = ? WHERE id = ?')
            .run(Date.now(), ip || null, dt.id);
    } catch (_) {}
    return { user, deviceTokenId: dt.id, hardwareId: dt.hardware_id || null };
}

function revokeDeviceToken(deviceTokenId, userId) {
    const db = getDb();
    return db.prepare('UPDATE device_tokens SET revoked = 1 WHERE id = ? AND user_id = ?')
        .run(deviceTokenId, userId).changes;
}

function listUserDevices(userId) {
    const db = getDb();
    return db.prepare(`
        SELECT id, device_name, os, app_version, hardware_id,
               local_license_status, local_license_expires_at, local_license_days_left, local_license_reported_at,
               created_at, last_used_at, last_ip, revoked, revoked_reason
        FROM device_tokens WHERE user_id = ? ORDER BY last_used_at DESC, created_at DESC
    `).all(userId);
}

/**
 * Update license.dat status for a device. Called by Desktop app after every
 * successful local validateLicense(). Lets /account display "License: Yearly
 * until 2027-XX-XX (365 days)" instead of the misleading Free counter.
 */
function reportLocalLicense({ deviceTokenId, status, expiresAt, daysLeft }) {
    if (!deviceTokenId) throw new Error('missing_device_token_id');
    const db = getDb();
    const ok = ['active', 'grace', null].includes(status);
    if (!ok) throw new Error('invalid_status');
    db.prepare(`
        UPDATE device_tokens
           SET local_license_status = ?,
               local_license_expires_at = ?,
               local_license_days_left = ?,
               local_license_reported_at = ?
         WHERE id = ?
    `).run(
        status || null,
        expiresAt || null,
        Number.isFinite(daysLeft) ? Math.max(0, Math.floor(daysLeft)) : null,
        Date.now(),
        deviceTokenId,
    );
    return { ok: true };
}

/**
 * Get the "best" license.dat status across a user's devices. Used by /account
 * to override Free counter with "Unlimited via license.dat (XXX days left)".
 * Returns the device with the highest days_left, or null if no device reported.
 */
function getBestLocalLicense(userId) {
    const db = getDb();
    return db.prepare(`
        SELECT id, hardware_id, device_name, local_license_status, local_license_expires_at, local_license_days_left, local_license_reported_at
        FROM device_tokens
        WHERE user_id = ? AND revoked = 0 AND local_license_status IN ('active','grace')
        ORDER BY local_license_days_left DESC NULLS LAST, local_license_reported_at DESC
        LIMIT 1
    `).get(userId);
}

// ─── Quota ───────────────────────────────────────────────────────────────

const PAID_PLANS = new Set(['monthly', 'yearly', 'lifetime']);

function _isPaid(plan) {
    return PAID_PLANS.has(String(plan || '').toLowerCase());
}

/**
 * Returns { plan, limit (or null=unlimited), used, remaining, resetInMs, allowed }.
 * Pure read — does not log anything.
 */
function getQuotaStatus(userId, plan) {
    const db = getDb();
    const dayKey = getThDayKey();
    const used = db.prepare(
        'SELECT COUNT(*) AS c FROM usage_log WHERE user_id = ? AND day_key = ?'
    ).get(userId, dayKey).c;
    if (_isPaid(plan)) {
        return { plan, limit: null, used, remaining: -1, resetInMs: msUntilThMidnight(), allowed: true };
    }
    const remaining = Math.max(0, FREE_DAILY_LIMIT - used);
    return {
        plan,
        limit: FREE_DAILY_LIMIT,
        used,
        remaining,
        resetInMs: msUntilThMidnight(),
        allowed: remaining > 0,
    };
}

/**
 * Check if user can process N files. Returns:
 *   { allowed: bool, allowedCount: N, blocked: M, ...status }
 * Used by desktop BEFORE upload to know "I asked for 5 but quota allows 2".
 */
function checkQuotaForBatch(userId, plan, requested = 1) {
    const status = getQuotaStatus(userId, plan);
    if (status.limit === null) {
        return { ...status, requested, allowedCount: requested, blocked: 0 };
    }
    const allowedCount = Math.min(requested, status.remaining);
    return { ...status, requested, allowedCount, blocked: requested - allowedCount, allowed: allowedCount > 0 };
}

/**
 * Record one file usage. Returns updated status.
 * Should be called AFTER the desktop successfully processes the file.
 */
function logUsage({ userId, plan, fileType, fileName, fileSize, deviceTokenId }) {
    const db = getDb();
    const ft = String(fileType || '').toLowerCase();
    if (!['step', 'pdf', 'jpg', 'jpeg', 'png'].includes(ft)) throw new Error('invalid_file_type');
    const dayKey = getThDayKey();
    db.prepare(`
        INSERT INTO usage_log (user_id, day_key, file_type, file_name, file_size, device_token_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, dayKey, ft === 'jpeg' ? 'jpg' : ft, fileName || null, fileSize || null, deviceTokenId || null, Date.now());
    return getQuotaStatus(userId, plan);
}

module.exports = {
    // Auth-link
    startAuthLink,
    getAuthLinkInfo,
    confirmAuthLink,
    exchangeAuthLink,
    cleanupExpiredCodes,
    // Device tokens
    validateDeviceToken,
    revokeDeviceToken,
    listUserDevices,
    reportLocalLicense,
    getBestLocalLicense,
    // Quota
    getQuotaStatus,
    checkQuotaForBatch,
    logUsage,
    getThDayKey,
    msUntilThMidnight,
    FREE_DAILY_LIMIT,
};
