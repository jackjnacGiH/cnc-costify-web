/**
 * Desktop ↔ Web auth flow + API client.
 *
 * Flow:
 *   1. signInStart() → POST /api/desktop/auth-link/start (HW ID, OS, version)
 *   2. open browser → user confirms on /desktop-auth
 *   3. signInPoll() (called by main.js every ~2s) → GET /exchange
 *   4. on success → save session via webSession.saveSession()
 *
 * API helpers (use stored device_token + HW ID):
 *   me() / quotaCheck(n) / quotaLog(meta)
 *
 * NOTE: This file does NOT modify license.dat or licenseManager.
 *       The existing offline-license path remains fully intact.
 */
const os = require('os');
const { app, shell } = require('electron');
const licenseManager = require('./licenseManager');
const webSession = require('./webSession');

const DEFAULT_API_BASE = 'https://api.cnccostify.cloud';
const DEFAULT_WEB_BASE = 'https://www.cnccostify.cloud';

function getApiBase() {
    return (process.env.CNC_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, '');
}
function getWebBase() {
    return (process.env.CNC_WEB_BASE || DEFAULT_WEB_BASE).replace(/\/+$/, '');
}

function _appVersion() {
    try { return app.getVersion(); } catch { return null; }
}

function _deviceName() {
    try { return `${os.hostname()} (${os.platform()})`; } catch { return null; }
}

async function _fetch(path, options = {}) {
    const url = path.startsWith('http') ? path : `${getApiBase()}${path}`;
    const res = await fetch(url, options);
    let data = null;
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data };
}

// ─── Auth-link flow ─────────────────────────────────────────────────────

/** Start: returns { code, expiresIn, authorizeUrl, hardware_id }. */
async function signInStart(locale = 'th') {
    const hardware_id = licenseManager.computeHardwareId();
    if (!hardware_id) {
        throw new Error('hardware_id_unavailable');
    }
    const { ok, status, data } = await _fetch('/api/desktop/auth-link/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            os: process.platform,
            app_version: _appVersion(),
            device_name: _deviceName(),
            hardware_id,
        }),
    });
    if (!ok) throw new Error(`start_failed_${status}_${data?.error || 'unknown'}`);
    // Override URL to localized path if provided
    let authorizeUrl = data.authorize_url;
    if (locale === 'en' && authorizeUrl) authorizeUrl = authorizeUrl.replace('/th/', '/en/');
    return { code: data.code, expiresIn: data.expires_in, authorizeUrl, hardware_id };
}

/** Open the browser to the authorize URL. */
function openAuthorizeUrl(url) {
    try { shell.openExternal(url); return true; } catch { return false; }
}

/** Poll exchange. Returns { status: 'pending'|'authorized'|'error', token?, user? }. */
async function signInPoll(code) {
    const { status, data } = await _fetch(
        `/api/desktop/auth-link/exchange?code=${encodeURIComponent(code)}`
    );
    if (status === 202) return { status: 'pending' };
    if (status === 200 && data?.ok && data?.token) {
        return { status: 'authorized', token: data.token, user: data.user };
    }
    return { status: 'error', error: data?.error || `http_${status}` };
}

/** Helper: poll until authorized/expired/cancelled. resolves with the result. */
async function signInPollLoop(code, { intervalMs = 2000, timeoutMs = 5 * 60 * 1000, signal } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (signal && signal.aborted) return { status: 'cancelled' };
        const r = await signInPoll(code);
        if (r.status !== 'pending') return r;
        await new Promise((res) => setTimeout(res, intervalMs));
    }
    return { status: 'timeout' };
}

/** Full sign-in: start → open browser → poll until done → save session. */
async function signInFull(locale = 'th', { onPending } = {}) {
    const start = await signInStart(locale);
    openAuthorizeUrl(start.authorizeUrl);
    if (typeof onPending === 'function') onPending(start);
    const result = await signInPollLoop(start.code);
    if (result.status === 'authorized') {
        webSession.saveSession({
            token: result.token,
            user: result.user,
            hardware_id: start.hardware_id,
        });
        return { ok: true, user: result.user, hardware_id: start.hardware_id };
    }
    return { ok: false, status: result.status, error: result.error || null };
}

function signOut() {
    webSession.clearSession();
    return true;
}

function getSession() {
    return webSession.loadSession();
}

// ─── Authenticated API helpers ──────────────────────────────────────────

function _authHeaders(session) {
    const h = { 'Content-Type': 'application/json' };
    if (session?.token) h.Authorization = `Bearer ${session.token}`;
    if (session?.hardware_id) h['X-Hardware-ID'] = session.hardware_id;
    return h;
}

/** Fetch /api/desktop/me → returns { user, quota } or throws. */
async function me() {
    const session = getSession();
    if (!session) return { ok: false, error: 'not_signed_in' };
    const { ok, status, data } = await _fetch('/api/desktop/me', { headers: _authHeaders(session) });
    if (status === 401) {
        // Token revoked or HW changed
        return { ok: false, error: data?.error || 'invalid_session', revoked: true };
    }
    if (!ok) return { ok: false, error: data?.error || `http_${status}` };
    return { ok: true, user: data.user, quota: data.quota };
}

/** Pre-check quota for N files; returns { allowed, allowedCount, blocked, plan, limit, used, remaining }. */
async function quotaCheck(requested = 1) {
    const session = getSession();
    if (!session) return { ok: false, error: 'not_signed_in' };
    const { ok, status, data } = await _fetch('/api/quota/check', {
        method: 'POST',
        headers: _authHeaders(session),
        body: JSON.stringify({ requested }),
    });
    if (!ok) return { ok: false, error: data?.error || `http_${status}` };
    return { ok: true, ...data };
}

/** Log a successful file processing. Pass { fileType, fileName, fileSize, pageCount? }. */
async function quotaLog({ fileType, fileName, fileSize, pageCount } = {}) {
    const session = getSession();
    if (!session) return { ok: false, error: 'not_signed_in' };
    const { ok, status, data } = await _fetch('/api/quota/log', {
        method: 'POST',
        headers: _authHeaders(session),
        body: JSON.stringify({ file_type: fileType, file_name: fileName, file_size: fileSize, page_count: pageCount }),
    });
    if (!ok) return { ok: false, error: data?.error || `http_${status}`, status };
    return { ok: true, ...data };
}

/**
 * Report local license.dat status to backend so /account can display
 * "Unlimited via license.dat (XXX days left)" instead of the Free counter.
 *
 * Pass the result of licenseManager.validateLicense() directly:
 *   reportLocalLicense({status: 'active'|'grace'|null, expires_at, days_left})
 *
 * Safe to call repeatedly — backend just updates the row. No-ops if not signed-in.
 */
async function reportLocalLicense({ status, expires_at, days_left } = {}) {
    const session = getSession();
    if (!session) return { ok: false, error: 'not_signed_in' };
    const { ok, status: httpStatus, data } = await _fetch('/api/desktop/report-license', {
        method: 'POST',
        headers: _authHeaders(session),
        body: JSON.stringify({
            status: status || null,
            expires_at: expires_at || null,
            days_left: typeof days_left === 'number' ? days_left : null,
        }),
    });
    if (!ok) return { ok: false, error: data?.error || `http_${httpStatus}` };
    return { ok: true };
}

// ─── V5.9: AI Proxy (Monthly+ plan-based shared AI) ─────────────────────

/**
 * POST /api/ai/proxy/analyze with Bearer token + HW ID.
 * Sends Gemini-format payload; returns same shape as /api/aey-analyze.
 * Returns { ok: false, error, status } on auth/plan/quota failure.
 */
async function aiProxyAnalyze(geminiPayload) {
    const session = getSession();
    if (!session?.token) return { ok: false, error: 'not_signed_in' };
    const { ok, status, data } = await _fetch('/api/ai/proxy/analyze', {
        method: 'POST',
        headers: _authHeaders(session),
        body: JSON.stringify(geminiPayload || {}),
    });
    if (!ok) return { ok: false, status, error: data?.friendly || data?.error || `http_${status}`, raw: data };
    return { ok: true, ...data };
}

/**
 * POST /api/ai/proxy/chat with Bearer token + HW ID.
 * Body: { messages, domain, system? } — returns { ok, text, provider, model }.
 */
async function aiProxyChat({ messages, domain, system } = {}) {
    const session = getSession();
    if (!session?.token) return { ok: false, error: 'not_signed_in' };
    const { ok, status, data } = await _fetch('/api/ai/proxy/chat', {
        method: 'POST',
        headers: _authHeaders(session),
        body: JSON.stringify({ messages, domain, system }),
    });
    if (!ok) return { ok: false, status, error: data?.friendly || data?.error || `http_${status}`, raw: data };
    return { ok: true, ...data };
}

module.exports = {
    // Flow
    signInStart,
    signInPoll,
    signInPollLoop,
    signInFull,
    openAuthorizeUrl,
    signOut,
    getSession,
    // API
    me,
    quotaCheck,
    quotaLog,
    reportLocalLicense,
    // V5.9: AI proxy
    aiProxyAnalyze,
    aiProxyChat,
    // URLs
    getApiBase,
    getWebBase,
};
