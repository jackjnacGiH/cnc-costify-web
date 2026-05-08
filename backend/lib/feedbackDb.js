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

        -- Phase B: Desktop App ↔ Web link
        -- Tokens issued to desktop app after web "Authorize" flow.
        -- Long-lived (1 year) but revocable; one user can have multiple devices.
        CREATE TABLE IF NOT EXISTS device_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            hardware_id TEXT,            -- 'sha256:...' — bound at confirmation
            device_name TEXT,            -- e.g. "Windows PC — DESKTOP-AB12"
            os TEXT,                     -- 'win32' / 'darwin' / 'linux'
            app_version TEXT,            -- e.g. '5.1.0'
            created_at INTEGER NOT NULL,
            last_used_at INTEGER,
            last_ip TEXT,
            revoked INTEGER NOT NULL DEFAULT 0,
            revoked_reason TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_device_tokens_hash ON device_tokens(token_hash);
        -- idx_device_tokens_hw is created in the migration section below
        -- (avoids "no such column" if device_tokens existed before hardware_id was added)

        -- Pending auth-link codes (5-minute TTL).
        -- Flow: desktop opens browser /desktop-auth?code=XYZ → user confirms →
        -- web sets user_id on this row → desktop polls /api/desktop/auth-link/exchange.
        CREATE TABLE IF NOT EXISTS auth_link_codes (
            code TEXT PRIMARY KEY,
            user_id INTEGER,             -- NULL until user authorizes
            device_token TEXT,           -- set by web on confirm; consumed by desktop
            hardware_id TEXT,            -- supplied by desktop on /start
            os TEXT,
            app_version TEXT,
            device_name TEXT,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            consumed INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_auth_link_codes_expires ON auth_link_codes(expires_at);

        -- Daily usage log (1 row per file).
        -- Quota = COUNT(*) WHERE user_id=? AND day_key='YYYY-MM-DD' (TH timezone).
        CREATE TABLE IF NOT EXISTS usage_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            day_key TEXT NOT NULL,       -- 'YYYY-MM-DD' in Asia/Bangkok
            file_type TEXT NOT NULL,     -- 'step' | 'pdf' | 'jpg'
            file_name TEXT,
            file_size INTEGER,           -- bytes
            device_token_id INTEGER,     -- which device logged this
            created_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_usage_log_user_day ON usage_log(user_id, day_key);
        CREATE INDEX IF NOT EXISTS idx_usage_log_created ON usage_log(created_at DESC);
    `);

    // ─── Lightweight migrations (idempotent) ───────────────────────────
    // Add columns to existing tables if missing (CREATE TABLE IF NOT EXISTS won't add cols to a pre-existing table).
    _addColumnIfMissing(db, 'device_tokens', 'hardware_id', 'TEXT');
    _addColumnIfMissing(db, 'device_tokens', 'revoked_reason', 'TEXT');
    _addColumnIfMissing(db, 'auth_link_codes', 'hardware_id', 'TEXT');
    // Phase B.5.fix: store license.dat status reported by Desktop app
    _addColumnIfMissing(db, 'device_tokens', 'local_license_status', 'TEXT');     // 'active' | 'grace' | null
    _addColumnIfMissing(db, 'device_tokens', 'local_license_expires_at', 'TEXT'); // ISO date string
    _addColumnIfMissing(db, 'device_tokens', 'local_license_days_left', 'INTEGER');
    _addColumnIfMissing(db, 'device_tokens', 'local_license_reported_at', 'INTEGER');
    try { db.exec('CREATE INDEX IF NOT EXISTS idx_device_tokens_hw ON device_tokens(hardware_id)'); } catch (_) {}

    // Phase A: orders table may have been created before payment_method etc.
    // were added. Add all Phase-A-era columns idempotently.
    _addColumnIfMissing(db, 'orders', 'payment_method', "TEXT");
    _addColumnIfMissing(db, 'orders', 'slip_path', 'TEXT');
    _addColumnIfMissing(db, 'orders', 'payment_ref', 'TEXT');
    _addColumnIfMissing(db, 'orders', 'confirmed_at', 'INTEGER');
    _addColumnIfMissing(db, 'orders', 'confirmed_by', 'INTEGER');
    _addColumnIfMissing(db, 'orders', 'notes', 'TEXT');
    _addColumnIfMissing(db, 'orders', 'currency', "TEXT DEFAULT 'THB'");
    // User-supplied hardware_id at order time (overrides device-token lookup)
    _addColumnIfMissing(db, 'orders', 'hardware_id', 'TEXT');

    // Phase A: licenses table — make sure all columns exist
    _addColumnIfMissing(db, 'licenses', 'license_dat_json', 'TEXT');
    _addColumnIfMissing(db, 'licenses', 'hardware_id', 'TEXT');
    _addColumnIfMissing(db, 'licenses', 'plan', 'TEXT');
}

function _addColumnIfMissing(db, table, column, type) {
    try {
        const cols = db.prepare(`PRAGMA table_info(${table})`).all();
        if (!cols.some((c) => c.name === column)) {
            db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        }
    } catch (e) {
        console.warn(`[feedbackDb] migration skip ${table}.${column}:`, e.message);
    }
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
