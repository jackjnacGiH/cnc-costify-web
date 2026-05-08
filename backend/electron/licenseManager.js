const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Public key PEM for Ed25519 signature verification.
// Phase A: production keypair — private key lives on VPS as LICENSE_PRIVATE_KEY.
// Legacy key kept for backward compatibility with test licenses signed pre-Phase-A.
const ADMIN_PUBKEY_ID = 'admin-key-2026';
const ADMIN_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAFOy+bKqUgQpCuRfWMCebgJMeGsqsxh9DVPnjrKSRTz4=
-----END PUBLIC KEY-----`;
// Older licenses signed with the prior placeholder key still validate.
const LEGACY_KEYS = [
    {
        id: 'admin-key-2025',
        pem: `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAOCEL276y/rY0gTmC+brztVNhCTbi+WF9WnDAlCLbjmM=
-----END PUBLIC KEY-----`,
    },
];

// Utility: canonical JSON with sorted keys (stable, no spaces)
function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map((v) => canonicalize(v)).join(',')}]`;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `"${k}":${canonicalize(obj[k])}`);
  return `{${parts.join(',')}}`;
}

function readLicensePaths() {
  const programData = process.env.PROGRAMDATA || 'C\\ProgramData';
  const userData = path.join(process.env.USERPROFILE || require('os').homedir(), 'AppData', 'Roaming');
  return [
    path.join(programData, 'CNCcostifyAI', 'license.dat'),
    path.join(userData, 'CNCcostifyAI', 'license.dat'),
    // Dev/test fallbacks
    path.join(process.cwd(), 'license.dat'),
    path.join(__dirname, '..', 'license.dat'),
  ];
}

function loadLicenseFile() {
  const candidates = readLicensePaths();
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const json = JSON.parse(raw);
        return { json, path: p };
      }
    } catch (_) {}
  }
  return null;
}

function getLoadedLicensePath() {
  const lf = loadLicenseFile();
  return lf && lf.path ? lf.path : null;
}

function parseBase64(input) {
  if (!input) return null;
  const s = String(input);
  const m = s.startsWith('base64:') ? s.slice('base64:'.length) : s;
  try { return Buffer.from(m, 'base64'); } catch (_) { return null; }
}

function _resolveKey(pubkeyId) {
    if (pubkeyId === ADMIN_PUBKEY_ID) return ADMIN_PUBLIC_KEY_PEM;
    const legacy = LEGACY_KEYS.find((k) => k.id === pubkeyId);
    return legacy ? legacy.pem : null;
}

function verifySignature(payload, signatureB64, pubkeyId, sigAlg) {
  if (sigAlg !== 'Ed25519') return { ok: false, error: 'Unsupported sig_alg' };
  const keyPem = _resolveKey(pubkeyId);
  if (!keyPem) return { ok: false, error: 'Unknown pubkey_id' };
  const sig = parseBase64(signatureB64);
  if (!sig) return { ok: false, error: 'Invalid signature encoding' };
  try {
    const data = Buffer.from(canonicalize(payload), 'utf8');
    const ok = crypto.verify(null, data, keyPem, sig);
    return ok ? { ok: true } : { ok: false, error: 'Signature verify failed' };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function getWindowsRegistryValue(keyPath, valueName) {
  // Example: keyPath='HKLM\SOFTWARE\Microsoft\Cryptography', valueName='MachineGuid'
  const res = spawnSync('reg', ['query', keyPath, '/v', valueName], { encoding: 'utf8' });
  if (res.status !== 0) return null;
  const m = /\s${valueName}\s+REG_[A-Z]+\s+(.*)/i.exec(res.stdout);
  return m && m[1] ? m[1].trim() : null;
}

function getWMICValue(command, field) {
  const res = spawnSync('wmic', [...command], { encoding: 'utf8' });
  if (res.status !== 0) return null;
  const lines = String(res.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  // Find first non-header line
  for (const line of lines) {
    if (!line.toLowerCase().includes(field.toLowerCase())) {
      return line.replace(/\s+/g, '');
    }
  }
  return null;
}

function computeHardwareId() {
  try {
    const parts = [];
    // MachineGuid
    const mg = getWindowsRegistryValue('HKLM\\SOFTWARE\\Microsoft\\Cryptography', 'MachineGuid');
    if (mg) parts.push(mg);
    // BIOS serial
    const bios = getWMICValue(['bios', 'get', 'serialnumber'], 'serialnumber');
    if (bios) parts.push(bios);
    // Baseboard serial
    const board = getWMICValue(['baseboard', 'get', 'serialnumber'], 'serialnumber');
    if (board) parts.push(board);
    // Disk volume serial (C:)
    const vol = getWMICValue(['logicaldisk', 'where', 'DeviceID="C:"', 'get', 'VolumeSerialNumber'], 'volumeserialnumber');
    if (vol) parts.push(vol);

    const joined = parts.join('|').toLowerCase();
    const digest = crypto.createHash('sha256').update(joined).digest('hex');
    return `sha256:${digest}`;
  } catch (e) {
    return null;
  }
}

function parseIso(s) {
  try { return new Date(String(s)); } catch (_) { return null; }
}

function validateTime(payload) {
  const now = new Date();
  const nb = parseIso(payload.not_before);
  const exp = parseIso(payload.expires_at);
  const tolSec = Number(payload.time_tolerance_sec || 0);
  const graceDays = Number(payload.grace_period_days || 0);
  if (!nb || !exp) return { ok: false, error: 'Invalid time fields' };
  const tolMs = tolSec * 1000;
  const graceMs = graceDays * 86400000;
  if (now.getTime() + tolMs < nb.getTime()) return { ok: false, error: 'Not before' };
  if (now.getTime() <= exp.getTime()) return { ok: true, status: 'active' };
  if (now.getTime() <= exp.getTime() + graceMs) return { ok: true, status: 'grace' };
  return { ok: false, error: 'Expired' };
}

function validateLicense() {
  const lf = loadLicenseFile();
  if (!lf) return { ok: false, error: 'license.dat not found' };
  const { json } = lf;
  const { payload, signature, sig_alg, pubkey_id } = json || {};
  if (!payload || !signature) return { ok: false, error: 'Missing payload/signature' };
  // Check revocation flag
  if (payload.revoked === true) return { ok: false, error: 'Revoked' };

  // Hardware binding
  const hw = computeHardwareId();
  if (!hw) return { ok: false, error: 'Hardware ID unavailable' };
  if (String(payload.hardware_id || '').trim().toLowerCase() !== String(hw).trim().toLowerCase()) {
    return { ok: false, error: 'Hardware mismatch' };
  }

  // Signature
  const sig = verifySignature(payload, signature, pubkey_id, sig_alg);
  if (!sig.ok) return { ok: false, error: sig.error || 'Signature invalid' };

  // Time window
  const tw = validateTime(payload);
  if (!tw.ok) return { ok: false, error: tw.error };
  // Augment with remaining days and dates for UI
  const now = new Date();
  const exp = parseIso(payload.expires_at);
  const nb = parseIso(payload.not_before);
  const graceDays = Number(payload.grace_period_days || 0);
  const graceMs = graceDays * 86400000;
  let untilDate = exp ? new Date(exp.getTime()) : null;
  if (tw.status === 'grace' && exp) {
    untilDate = new Date(exp.getTime() + graceMs);
  }
  let daysLeft = null;
  if (untilDate) {
    const msLeft = untilDate.getTime() - now.getTime();
    daysLeft = Math.max(0, Math.ceil(msLeft / 86400000));
  }
  return {
    ok: true,
    status: tw.status,
    expires_at: exp ? exp.toISOString() : null,
    not_before: nb ? nb.toISOString() : null,
    grace_period_days: graceDays,
    until: untilDate ? untilDate.toISOString() : null,
    days_left: daysLeft,
  };
}

module.exports = {
  validateLicense,
  computeHardwareId,
  readLicensePaths,
  getLoadedLicensePath,
};