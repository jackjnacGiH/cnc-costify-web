/**
 * Web session storage for Desktop App.
 *
 * Stores the device_token + bound user info in `userData/web-session.json`,
 * encrypted with Electron's safeStorage when available (DPAPI on Windows).
 *
 * Design intentionally PARALLEL to license.dat — does NOT modify or replace it.
 *   • license.dat (offline Ed25519, existing)  ← still works as before
 *   • web-session.json (online, new)           ← optional alternative
 *
 * Public API:
 *   loadSession()  → { token, user, hardware_id } | null
 *   saveSession({ token, user, hardware_id })
 *   clearSession()
 *   getSessionPath()
 */
const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');

const FILE_NAME = 'web-session.json';

function getSessionPath() {
    return path.join(app.getPath('userData'), FILE_NAME);
}

function _encrypt(plaintext) {
    try {
        if (safeStorage && safeStorage.isEncryptionAvailable && safeStorage.isEncryptionAvailable()) {
            const buf = safeStorage.encryptString(plaintext);
            return { enc: 'safeStorage', value: buf.toString('base64') };
        }
    } catch (_) {}
    // Fallback (still file-protected by OS account permissions)
    return { enc: 'plain', value: plaintext };
}

function _decrypt(record) {
    try {
        if (record && record.enc === 'safeStorage' && record.value) {
            const buf = Buffer.from(record.value, 'base64');
            return safeStorage.decryptString(buf);
        }
        if (record && record.enc === 'plain') return record.value;
    } catch (_) {}
    return null;
}

function loadSession() {
    try {
        const p = getSessionPath();
        if (!fs.existsSync(p)) return null;
        const raw = fs.readFileSync(p, 'utf8');
        const obj = JSON.parse(raw);
        if (!obj || !obj.token_record) return null;
        const token = _decrypt(obj.token_record);
        if (!token) return null;
        return {
            token,
            user: obj.user || null,
            hardware_id: obj.hardware_id || null,
            saved_at: obj.saved_at || null,
        };
    } catch (e) {
        console.warn('[webSession] loadSession failed:', e.message);
        return null;
    }
}

function saveSession({ token, user, hardware_id }) {
    if (!token) throw new Error('missing_token');
    const p = getSessionPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
        version: 1,
        token_record: _encrypt(String(token)),
        user: user || null,
        hardware_id: hardware_id || null,
        saved_at: Date.now(),
    };
    fs.writeFileSync(p, JSON.stringify(payload, null, 2), 'utf8');
    try { fs.chmodSync(p, 0o600); } catch (_) {}
    return p;
}

function clearSession() {
    try {
        const p = getSessionPath();
        if (fs.existsSync(p)) fs.unlinkSync(p);
        return true;
    } catch (e) {
        console.warn('[webSession] clearSession failed:', e.message);
        return false;
    }
}

module.exports = {
    loadSession,
    saveSession,
    clearSession,
    getSessionPath,
};
