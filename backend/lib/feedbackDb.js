/**
 * SQLite store for feedback submissions and (later) users/licenses.
 *
 * DB location:
 *   - LOCALAPPDATA/CNC Costify AI/data/cnc.db   (Windows desktop install — writable per-user)
 *   - PROGRAMDATA/CNC Costify AI/data/cnc.db    (Windows shared)
 *   - $HOME/.cnc-costify/data/cnc.db            (Linux/macOS / Hostinger VPS)
 *   - ./data/cnc.db                              (dev fallback in project root)
 *
 * First writable candidate wins. Single-process safe (better-sqlite3 is sync).
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let _db = null;
let _dbPath = null;

function _pickDbDir() {
    const candidates = [];
    if (process.env.LOCALAPPDATA) {
        candidates.push(path.join(process.env.LOCALAPPDATA, 'CNC Costify AI', 'data'));
    }
    if (process.env.PROGRAMDATA) {
        candidates.push(path.join(process.env.PROGRAMDATA, 'CNC Costify AI', 'data'));
    }
    if (process.env.HOME) {
        candidates.push(path.join(process.env.HOME, '.cnc-costify', 'data'));
    }
    candidates.push(path.join(__dirname, '..', 'data'));
    for (const dir of candidates) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            // write test
            const t = path.join(dir, '.write_test');
            fs.writeFileSync(t, 'ok');
            fs.unlinkSync(t);
            return dir;
        } catch (_) { /* try next */ }
    }
    return candidates[candidates.length - 1];
}

function getDb() {
    if (_db) return _db;
    const dir = _pickDbDir();
    _dbPath = path.join(dir, 'cnc.db');
    _db = new Database(_dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _initSchema(_db);
    console.log(`[feedbackDb] using ${_dbPath}`);
    return _db;
}

function _initSchema(db) {
    // ── Phase 1: Feedback ──
    db.exec(`
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at INTEGER NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            importance INTEGER NOT NULL DEFAULT 3,
            name TEXT,
            email TEXT,
            locale TEXT,
            page_url TEXT,
            ip TEXT,
            user_agent TEXT,
            status TEXT NOT NULL DEFAULT 'new'
        );
        CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
        CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
    `);

    // ── Phase 2: Users (auth) ──
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            company TEXT,
            phone TEXT,
            plan TEXT NOT NULL DEFAULT 'free',         -- 'free' | 'monthly' | 'yearly' | 'lifetime'
            plan_expires_at INTEGER,                    -- unix ms; NULL = never (lifetime/free)
            verified INTEGER NOT NULL DEFAULT 0,        -- 0/1 (email verified)
            verify_token TEXT,
            reset_token TEXT,
            reset_token_expires_at INTEGER,
            role TEXT NOT NULL DEFAULT 'user',          -- 'user' | 'admin'
            created_at INTEGER NOT NULL,
            last_login_at INTEGER,
            last_ip TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
    `);

    // ── Phase 2: Licenses (desktop) ──
    db.exec(`
        CREATE TABLE IF NOT EXISTS licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            license_key TEXT UNIQUE NOT NULL,
            plan TEXT NOT NULL,
            hardware_id TEXT,                           -- bound on first activation
            valid_until INTEGER,                        -- NULL = lifetime
            status TEXT NOT NULL DEFAULT 'active',      -- 'active' | 'revoked' | 'expired'
            created_at INTEGER NOT NULL,
            activated_at INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
        CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses(user_id);
    `);

    // ── Phase 2: Orders (manual payment) ──
    db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'THB',
            slip_path TEXT,
            payment_ref TEXT,
            status TEXT NOT NULL DEFAULT 'pending',     -- 'pending' | 'confirmed' | 'rejected'
            note TEXT,
            created_at INTEGER NOT NULL,
            confirmed_at INTEGER,
            confirmed_by INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);

    // ── Phase 2: Sessions (refresh tokens / activity log) ──
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            revoked INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    `);
}

const VALID_CATEGORIES = new Set([
    'newFeature', 'improvement', 'bugReport', 'uiux', 'integration', 'performance', 'other',
]);

function insertFeedback(input) {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT INTO feedback (created_at, category, title, description, importance, name, email, locale, page_url, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const r = stmt.run(
        Date.now(),
        input.category,
        input.title,
        input.description,
        Math.max(1, Math.min(5, parseInt(input.importance, 10) || 3)),
        input.name || null,
        input.email || null,
        input.locale || null,
        input.page || null,
        input.ip || null,
        input.user_agent || null,
    );
    return r.lastInsertRowid;
}

function listFeedback({ limit = 100, offset = 0, status = null, category = null } = {}) {
    const db = getDb();
    const where = [];
    const args = [];
    if (status) { where.push('status = ?'); args.push(status); }
    if (category) { where.push('category = ?'); args.push(category); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `SELECT * FROM feedback ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    return db.prepare(sql).all(...args, limit, offset);
}

function countFeedback() {
    const db = getDb();
    return db.prepare('SELECT COUNT(*) as n FROM feedback').get().n;
}

function updateFeedbackStatus(id, status) {
    const db = getDb();
    return db.prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, id).changes;
}

module.exports = {
    getDb,
    insertFeedback,
    listFeedback,
    countFeedback,
    updateFeedbackStatus,
    VALID_CATEGORIES,
    get dbPath() { return _dbPath; },
};
