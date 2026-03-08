const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'users.db'));

// Initialize Database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        google_id TEXT,
        name TEXT,
        role TEXT DEFAULT 'user'
    )`);
});

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        done(err, row);
    });
});

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (Incorrect email or password)' });
        if (!user.password) return done(null, false, { message: 'กรุณาเข้าสู่ระบบด้วย Google (Please login with Google)' });
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return done(err);
            if (isMatch) return done(null, user);
            return done(null, false, { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (Incorrect email or password)' });
        });
    });
}));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    db.get('SELECT * FROM users WHERE google_id = ? OR email = ?', [profile.id, email], (err, user) => {
        if (err) return done(err);
        if (user) {
            if (!user.google_id) {
                db.run('UPDATE users SET google_id = ? WHERE id = ?', [profile.id, user.id]);
            }
            return done(null, user);
        } else {
            db.run('INSERT INTO users (email, google_id, name) VALUES (?, ?, ?)', [email, profile.id, profile.displayName], function(err) {
                if (err) return done(err);
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                    return done(err, newUser);
                });
            });
        }
    });
}));

function setupAuth(app) {
    app.post('/register', (req, res) => {
        const { email, password, name } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
        
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hash, name], function(err) {
                if (err) return res.status(400).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว (Email already exists)' });
                res.json({ success: true });
            });
        });
    });

    app.post('/login', passport.authenticate('local'), (req, res) => {
        res.json({ success: true });
    });

    app.get('/logout', (req, res) => {
        req.logout(() => {
            res.redirect('/login.html');
        });
    });

    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html?error=google' }), (req, res) => {
        res.redirect('/');
    });

    app.get('/api/user', (req, res) => {
        if (req.isAuthenticated()) {
            res.json({ success: true, user: { email: req.user.email, name: req.user.name, role: req.user.role } });
        } else {
            res.status(401).json({ success: false, error: 'Unauthorized' });
        }
    });
}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login.html');
}

module.exports = { setupAuth, isAuthenticated };
