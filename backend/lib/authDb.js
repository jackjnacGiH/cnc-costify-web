/**
 * User authentication helpers — uses the same SQLite DB as feedbackDb.js
 *
 * Phase 2.1: signup / login / JWT issuance + verification
 *
 * Public API:
 *   createUser({ email, password, name?, company?, phone? })  → user object (sans password_hash)
 *   authenticate({ email, password })                          → user or null
 *   findUserById(id) / findUserByEmail(email)                  → row or null
 *   issueJWT(user, expiresIn?)                                 → string (signed JWT)
 *   verifyJWT(token)                                           → payload or null
 *   updateLastLogin(userId, ip)                                → void
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('./feedbackDb');

const BCRYPT_ROUNDS = 12;
const JWT_DEFAULT_EXPIRY = '30d'; // 30-day cookie

function getJwtSecret() {
    const s = process.env.JWT_SECRET;
    if (!s || s.length < 32) {
        // Fallback for dev — warn loudly
        console.warn('[auth] WARNING: JWT_SECRET not set or too short. Using insecure dev fallback.');
        return 'DEV_INSECURE_FALLBACK_DO_NOT_USE_IN_PRODUCTION_PLEASE_SET_JWT_SECRET_ENV';
    }
    return s;
}

function _safeUser(row) {
    if (!row) return null;
    const { password_hash, verify_token, reset_token, ...safe } = row;
    return safe;
}

async function createUser({ email, password, name = null, company = null, phone = null }) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('invalid_email');
    }
    if (!password || password.length < 8) {
        throw new Error('password_too_short');  // min 8 chars
    }
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) throw new Error('email_already_registered');

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const verify_token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    const stmt = db.prepare(`
        INSERT INTO users (email, password_hash, name, company, phone, plan, verified, verify_token, role, created_at)
        VALUES (?, ?, ?, ?, ?, 'free', 0, ?, 'user', ?)
    `);
    const result = stmt.run(
        email.toLowerCase().trim(),
        password_hash,
        name,
        company,
        phone,
        verify_token,
        now,
    );
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    return { user: _safeUser(user), verify_token };
}

async function authenticate({ email, password }) {
    if (!email || !password) return null;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    return user; // full row — caller decides what to expose
}

function findUserById(id) {
    if (!id) return null;
    return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function findUserByEmail(email) {
    if (!email) return null;
    return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
}

function updateLastLogin(userId, ip) {
    getDb().prepare('UPDATE users SET last_login_at = ?, last_ip = ? WHERE id = ?')
        .run(Date.now(), ip || null, userId);
}

function issueJWT(user, expiresIn = JWT_DEFAULT_EXPIRY) {
    const payload = {
        sub: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
    };
    return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

function verifyJWT(token) {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch (_) {
        return null;
    }
}

function verifyEmailToken(token) {
    if (!token) return null;
    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE verify_token = ?').get(token);
    if (!user) return null;
    db.prepare('UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?').run(user.id);
    return user.id;
}

function setResetToken(email) {
    const db = getDb();
    const user = findUserByEmail(email);
    if (!user) return null; // don't leak existence
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?')
        .run(token, expires, user.id);
    return { token, user };
}

async function consumeResetToken(token, newPassword) {
    if (!token || !newPassword || newPassword.length < 8) throw new Error('invalid_input');
    const db = getDb();
    const user = db.prepare(
        'SELECT id, reset_token_expires_at FROM users WHERE reset_token = ?'
    ).get(token);
    if (!user) throw new Error('invalid_token');
    if (Date.now() > user.reset_token_expires_at) throw new Error('token_expired');
    const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    db.prepare(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?'
    ).run(password_hash, user.id);
    return user.id;
}

module.exports = {
    createUser,
    authenticate,
    findUserById,
    findUserByEmail,
    updateLastLogin,
    issueJWT,
    verifyJWT,
    verifyEmailToken,
    setResetToken,
    consumeResetToken,
    _safeUser,
};
