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

/** Step 1: desktop starts the link flow. */
function startAuthLink({ os, appVersion, deviceName }) {
    const db = getDb();
    const code = _generateCode();
    const now = Date.now();
    db.prepare(`
        INSERT INTO auth_link_codes (code, user_id, device_token, os, app_version, device_name, created_at, expires_at, consumed)
        VALUES (?, NULL, NULL, ?, ?, ?, ?, ?, 0)
    `).run(code, os || null, appVersion || null, deviceName || null, now, now + AUTH_LINK_TTL_MS);
    return { code, expiresIn: Math.floor(AUTH_LINK_TTL_MS / 1000) };
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

    // Insert device_tokens row
    const dtRes = db.prepare(`
        INSERT INTO device_tokens (user_id, token_hash, device_name, os, app_version, created_at, last_used_at, last_ip, revoked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(userId, tokenHash, row.device_name, row.os, row.app_version, now, now, ip || null);

    // Attach to code row (token kept plaintext briefly until desktop exchanges it)
    db.prepare('UPDATE auth_link_codes SET user_id = ?, device_token = ? WHERE code = ?')
        .run(userId, token, code);

    return { ok: true, deviceTokenId: dtRes.lastInsertRowid };
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

/** Look up a device token; return {user, deviceTokenId} or null. */
function validateDeviceToken(token, ip) {
    if (!token) return null;
    const db = getDb();
    const tokenHash = _hash(token);
    const dt = db.prepare(`
        SELECT id, user_id, revoked FROM device_tokens WHERE token_hash = ?
    `).get(tokenHash);
    if (!dt || dt.revoked) return null;
    const user = db.prepare(
        'SELECT id, email, name, plan, role, verified, created_at FROM users WHERE id = ?'
    ).get(dt.user_id);
    if (!user) return null;
    // Update last-used (best-effort; do NOT throw if it fails)
    try {
        db.prepare('UPDATE device_tokens SET last_used_at = ?, last_ip = ? WHERE id = ?')
            .run(Date.now(), ip || null, dt.id);
    } catch (_) {}
    return { user, deviceTokenId: dt.id };
}

function revokeDeviceToken(deviceTokenId, userId) {
    const db = getDb();
    return db.prepare('UPDATE device_tokens SET revoked = 1 WHERE id = ? AND user_id = ?')
        .run(deviceTokenId, userId).changes;
}

function listUserDevices(userId) {
    const db = getDb();
    return db.prepare(`
        SELECT id, device_name, os, app_version, created_at, last_used_at, last_ip, revoked
        FROM device_tokens WHERE user_id = ? ORDER BY last_used_at DESC, created_at DESC
    `).all(userId);
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
    confirmAuthLink,
    exchangeAuthLink,
    cleanupExpiredCodes,
    // Device tokens
    validateDeviceToken,
    revokeDeviceToken,
    listUserDevices,
    // Quota
    getQuotaStatus,
    checkQuotaForBatch,
    logUsage,
    getThDayKey,
    msUntilThMidnight,
    FREE_DAILY_LIMIT,
};
