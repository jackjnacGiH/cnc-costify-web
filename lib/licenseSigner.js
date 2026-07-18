/**
 * License.dat generator (server side, Phase A).
 *
 * Signs a license payload with the Ed25519 private key stored in
 * `LICENSE_PRIVATE_KEY` env var (PEM, with literal \n escapes — see deploy
 * docs). The corresponding public key is embedded in
 * electron/licenseManager.js so Desktop V5.14+ verifies the signature offline.
 *
 * Output JSON shape matches what licenseManager.validateLicense() expects:
 *   { payload: {...}, signature: '...', sig_alg: 'Ed25519', pubkey_id: '...' }
 */
const crypto = require('crypto');

const PUBKEY_ID = 'admin-key-2026';

function _privateKey() {
    let pem = process.env.LICENSE_PRIVATE_KEY || '';
    if (!pem) throw new Error('LICENSE_PRIVATE_KEY not set in env');
    // Allow literal \n escapes (single-line env var format)
    pem = pem.replace(/\\n/g, '\n').trim();
    if (!pem.startsWith('-----BEGIN')) {
        throw new Error('LICENSE_PRIVATE_KEY does not look like a PEM');
    }
    return crypto.createPrivateKey(pem);
}

/** Stable JSON with sorted keys — must match electron/licenseManager.canonicalize. */
function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map((v) => canonicalize(v)).join(',')}]`;
    const keys = Object.keys(obj).sort();
    const parts = keys.map((k) => `"${k}":${canonicalize(obj[k])}`);
    return `{${parts.join(',')}}`;
}

/**
 * Build + sign a license. Inputs:
 *   userId, userEmail, plan ('yearly'|'lifetime'),
 *   hardwareId (optional — empty string means user can import to any HW once),
 *   validDays (number; for lifetime use a very large number e.g. 36500),
 *   licenseKey (string id, also stored in DB).
 *
 * Returns the full JSON object ready to write as license.dat.
 */
function buildAndSign({ userId, userEmail, plan, hardwareId, validDays, licenseKey }) {
    if (!licenseKey) throw new Error('missing_license_key');
    const now = new Date();
    const validFrom = now.toISOString();
    const validUntil = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString();
    const payload = {
        license_key: licenseKey,
        user_id: userId,
        user_email: userEmail,
        plan: String(plan).toLowerCase(),
        hardware_id: hardwareId || '',
        issued_at: validFrom,
        not_before: validFrom,
        expires_at: validUntil,
        grace_period_days: 14,
        time_tolerance_sec: 600,
        revoked: false,
        version: 1,
    };
    const data = Buffer.from(canonicalize(payload), 'utf8');
    const sig = crypto.sign(null, data, _privateKey());
    return {
        payload,
        signature: 'base64:' + sig.toString('base64'),
        sig_alg: 'Ed25519',
        pubkey_id: PUBKEY_ID,
    };
}

/** Generate a human-readable random license key (e.g. CNCT-XXXX-XXXX-XXXX). */
function generateLicenseKey() {
    const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    return `CNCT-${seg()}-${seg()}-${seg()}`;
}

module.exports = { buildAndSign, generateLicenseKey, canonicalize, PUBKEY_ID };
