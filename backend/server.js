const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ExcelJS = require('exceljs');
const axios = require('axios');
const { spawn } = require('child_process');
const net = require('net');
const http = require('http');
const licenseManager = require(path.join(__dirname, 'electron', 'licenseManager.js'));

const app = express();
const PORT = process.env.PORT || 5000;

// --- AI Provider Config (persistent) ---
// Pick the first writable config location. Prefer LOCALAPPDATA (per-user, always writable)
// over ProgramData (shared, may lack write perms on older installs).
// But if config already exists in any candidate, use that location (migration-friendly).
function _pickConfigPath() {
    const candidates = [
        process.env.LOCALAPPDATA,
        process.env.ProgramData,
        process.env.APPDATA,
        __dirname
    ]
        .filter(Boolean)
        .map(p => path.join(p, 'CNC Costify AI', 'config', 'api_config.json'));

    // Prefer existing config (if any) — don't fragment user data across locations
    for (const p of candidates) {
        try { if (fs.existsSync(p)) return p; } catch (_) {}
    }
    // No existing config → pick first writable location
    for (const p of candidates) {
        try {
            const dir = path.dirname(p);
            fs.mkdirSync(dir, { recursive: true });
            fs.accessSync(dir, fs.constants.W_OK);
            return p;
        } catch (_) {}
    }
    return candidates[0] || path.join(__dirname, 'config', 'api_config.json');
}
let CONFIG_PATH = _pickConfigPath();
console.log(`[config] Using config path: ${CONFIG_PATH}`);
function loadAiConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
            const cfg = JSON.parse(raw);
            return cfg && typeof cfg === 'object' ? cfg : {};
        }
    } catch (_) {}
    return {
        provider: process.env.AI_PROVIDER || 'gemini',
        gemini: {
            api_key: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '',
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
        },
        azure_speech: {
            api_key: process.env.AZURE_SPEECH_KEY || '',
            region: process.env.AZURE_SPEECH_REGION || ''
        }
    };
}
function saveAiConfig(cfg) {
    // Throw on failure so callers can report the error to the user.
    // If primary CONFIG_PATH is not writable, fall back to LOCALAPPDATA.
    const attempt = (p) => {
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
    };
    try {
        attempt(CONFIG_PATH);
    } catch (e) {
        console.error(`[config] Write failed at ${CONFIG_PATH}:`, e.message);
        // Fallback: try LOCALAPPDATA if we weren't already using it
        if (process.env.LOCALAPPDATA && !CONFIG_PATH.startsWith(process.env.LOCALAPPDATA)) {
            const fallback = path.join(process.env.LOCALAPPDATA, 'CNC Costify AI', 'config', 'api_config.json');
            console.warn(`[config] Falling back to: ${fallback}`);
            attempt(fallback); // if this throws, let it propagate
            CONFIG_PATH = fallback; // switch future reads/writes to this location
            return;
        }
        throw e; // bubble up — handler will return 500
    }
}
function maskKey(k) {
    const s = String(k || '');
    if (!s) return '';
    if (s.length <= 8) return '****';
    return s.slice(0, 4) + '...' + s.slice(-4);
}
let AI_CONFIG = loadAiConfig();
// Patch process.env from config for runtime use
process.env.AI_PROVIDER = AI_CONFIG.provider || process.env.AI_PROVIDER || 'gemini';
process.env.GOOGLE_API_KEY = AI_CONFIG.gemini?.api_key || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
process.env.GEMINI_MODEL = AI_CONFIG.gemini?.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// ── AI cost calculation: pricing table + USD→THB exchange rate ─────────────
// Prices in USD per 1M tokens (verified from OpenRouter & Google AI pricing pages)
const MODEL_PRICING = {
    // OpenRouter models (matches dropdown in Settings)
    'qwen/qwen2.5-vl-72b-instruct':                  { in: 0.40, out: 1.20 },
    'z-ai/glm-4.5v':                                 { in: 0.50, out: 1.80 },
    'anthropic/claude-3.5-sonnet':                   { in: 3.00, out: 15.00 },
    'google/gemini-2.0-flash-exp:free':              { in: 0.00, out: 0.00 },
    'meta-llama/llama-3.2-90b-vision-instruct:free': { in: 0.00, out: 0.00 },
    // Gemini API direct
    'gemini-2.5-flash':       { in: 0.30,  out: 2.50 },
    'gemini-2.0-flash-exp':   { in: 0.00,  out: 0.00 },  // preview/free
    'gemini-1.5-flash':       { in: 0.075, out: 0.30 },
};
const FALLBACK_PRICING = { in: 0.50, out: 1.50 };  // unknown model

let _usdThbCache = { rate: 35.0, fetchedAt: 0 };
const _USD_THB_TTL_MS = 60 * 60 * 1000; // 1 hour

async function _getUsdToThbRate() {
    const now = Date.now();
    if (now - _usdThbCache.fetchedAt < _USD_THB_TTL_MS) return _usdThbCache.rate;
    try {
        const r = await axios.get('https://api.frankfurter.app/latest?from=USD&to=THB', { timeout: 5000 });
        const rate = Number(r.data?.rates?.THB);
        if (rate > 10 && rate < 100) {
            _usdThbCache = { rate, fetchedAt: now };
            console.log(`[fx] USD→THB rate updated: ${rate}`);
            return rate;
        }
        console.warn(`[fx] frankfurter.app returned unexpected rate: ${rate} — using cached/fallback ${_usdThbCache.rate}`);
    } catch (e) {
        console.warn(`[fx] frankfurter.app failed: ${e.message} — using cached/fallback ${_usdThbCache.rate}`);
    }
    _usdThbCache.fetchedAt = now;  // prevent hammering on outage
    return _usdThbCache.rate;
}

async function _injectCostMetadata(responseData, modelId) {
    if (!responseData || typeof responseData !== 'object') return responseData;
    // 1. Extract token counts (Gemini uses usageMetadata, OpenRouter uses usage)
    const um = responseData.usageMetadata || {};
    const u  = responseData.usage || {};
    const tokensIn  = um.promptTokenCount     ?? u.prompt_tokens     ?? 0;
    const tokensOut = um.candidatesTokenCount ?? u.completion_tokens ?? 0;
    // 2. Look up pricing
    const pricing = MODEL_PRICING[modelId];
    if (!pricing) console.warn(`[cost] model "${modelId}" not in MODEL_PRICING — using fallback pricing`);
    const p = pricing || FALLBACK_PRICING;
    const costUsd = (tokensIn * p.in + tokensOut * p.out) / 1e6;
    // 3. Convert USD → THB
    const fxRate = await _getUsdToThbRate();
    const costThb = costUsd * fxRate;
    return {
        ...responseData,
        _tokensIn: tokensIn,
        _tokensOut: tokensOut,
        _costUsd: costUsd,
        _costThb: costThb,
        _fxRate: fxRate
    };
}

// ── Multi-key rotation state (in-memory, resets on app restart) ──────────────
let _geminiKeyIndex = 0;

/** Return all configured Gemini API keys as an array (dedup, non-empty). */
function getGeminiKeys() {
    const cfg = AI_CONFIG.gemini || {};
    // api_keys array takes priority over legacy api_key string
    const arr = Array.isArray(cfg.api_keys) ? cfg.api_keys.filter(k => k && k.trim()) : [];
    if (arr.length > 0) return arr;
    const single = (cfg.api_key || '').trim()
        || (process.env.GOOGLE_API_KEY || '').trim()
        || (process.env.GEMINI_API_KEY || '').trim();
    return single ? [single] : [];
}

/** Call Gemini vision API, rotating through all configured keys on 429/403. */
async function callGeminiWithRotation(payload, modelName) {
    const keys = getGeminiKeys();
    if (keys.length === 0) {
        const err = new Error('No Gemini API key configured');
        err.code = 'NO_KEYS';
        throw err;
    }
    let lastErr = null;
    for (let attempt = 0; attempt < keys.length; attempt++) {
        const idx = (_geminiKeyIndex + attempt) % keys.length;
        const key = keys[idx];
        try {
            const resp = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
                payload,
                { headers: { 'Content-Type': 'application/json' }, maxBodyLength: Infinity }
            );
            _geminiKeyIndex = idx; // remember last-successful key
            console.log(`[aey-analyze] Gemini OK key ${idx + 1}/${keys.length}`);
            return resp.data;
        } catch (err) {
            const status = err?.response?.status;
            const errMsg = String(err?.response?.data?.error?.message || err?.message || '');
            // Rotate to next key on ANY retryable API-level error when we have more keys:
            // 429 = quota exceeded, 403 = key invalid/revoked
            // 500/503 = model overload ("high demand"), transient backend error
            // Also catch Gemini RESOURCE_EXHAUSTED messages regardless of status
            const isRetryable = status === 429 || status === 403
                || status === 500 || status === 503
                || /high demand|resource.?exhausted|overload|quota|limit|try again/i.test(errMsg);

            if (isRetryable && keys.length > 1) {
                console.warn(`[aey-analyze] Key ${idx + 1}/${keys.length} failed (HTTP ${status || 'N/A'}: ${errMsg.slice(0, 80)}) → trying next key`);
                _geminiKeyIndex = (idx + 1) % keys.length;
                lastErr = err;
                continue;
            }
            // Only 1 key configured, or non-retryable error (bad request, auth, etc.) → fail fast
            throw err;
        }
    }
    const exhausted = new Error('All Gemini API keys exhausted');
    exhausted.code = 'ALL_KEYS_EXHAUSTED';
    exhausted.lastErr = lastErr;
    throw exhausted;
}

/** Convert Gemini-format payload → OpenAI messages array (for OpenRouter).
 *  - Images (image/*) → image_url part
 *  - PDFs (application/pdf) → file part (OpenRouter-specific multimodal format)
 *    See: https://openrouter.ai/docs/features/multimodal/pdfs
 */
function _geminiPayloadToOpenAIMessages(geminiPayload) {
    const systemText = geminiPayload?.systemInstruction?.parts?.map(p => p.text || '').join('\n') || '';
    const userParts = geminiPayload?.contents?.[0]?.parts || [];
    const content = [];
    for (const part of userParts) {
        if (part.text) {
            content.push({ type: 'text', text: part.text });
        } else if (part.inlineData) {
            const { mimeType, data } = part.inlineData;
            const dataUrl = `data:${mimeType};base64,${data}`;
            if (mimeType === 'application/pdf' || /pdf$/i.test(mimeType)) {
                // OpenRouter native PDF support via "file" content type
                content.push({
                    type: 'file',
                    file: { filename: 'drawing.pdf', file_data: dataUrl }
                });
            } else {
                content.push({ type: 'image_url', image_url: { url: dataUrl } });
            }
        }
    }
    const messages = [];
    if (systemText) messages.push({ role: 'system', content: systemText });
    messages.push({ role: 'user', content });
    return messages;
}

/** Call OpenRouter as fallback when all Gemini keys are exhausted. */
async function callOpenRouterForAnalysis(geminiPayload, model) {
    const key = (AI_CONFIG.openrouter?.api_key || '').trim();
    if (!key) {
        const err = new Error('OpenRouter API key not configured');
        err.code = 'NO_OPENROUTER_KEY';
        throw err;
    }
    const messages = _geminiPayloadToOpenAIMessages(geminiPayload);
    // Append strict JSON-only instruction to the last user message — Qwen/GLM can be chatty on PDFs
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && Array.isArray(lastMsg.content)) {
        lastMsg.content.push({
            type: 'text',
            text: '\n\nIMPORTANT: Respond with ONLY a single valid JSON object. No markdown code fences, no commentary before or after, no explanation. Use double quotes for all keys and string values. No trailing commas.'
        });
    }
    console.log(`[aey-analyze] OpenRouter fallback → model: ${model}`);
    // Note: don't pass response_format — many vision models (GLM-4.5V, Llama Vision) reject it.
    // Prompt already instructs JSON output; we strip code fences below.
    let resp;
    try {
        resp = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            { model, messages },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://cnccostify.cloud',
                    'X-Title': 'CNC Costify AI'
                },
                maxBodyLength: Infinity,
                timeout: 120000
            }
        );
    } catch (e) {
        const status = e?.response?.status;
        const body = e?.response?.data;
        // Log FULL response body so we can see the actual provider error metadata
        console.error(`[aey-analyze] OpenRouter ${status || ''} FULL response:`, JSON.stringify(body, null, 2));
        const meta = body?.error?.metadata;
        const upstream = body?.error?.message
            || body?.error
            || e?.message
            || 'unknown error';
        let msg = typeof upstream === 'string' ? upstream : JSON.stringify(upstream);
        // Append upstream provider metadata if present (gives the REAL reason)
        if (meta) {
            const metaStr = typeof meta === 'string' ? meta : JSON.stringify(meta);
            msg += ` [${metaStr.slice(0, 200)}]`;
        }
        const err = new Error(`OpenRouter (${model}): ${msg}`);
        err.code = 'OPENROUTER_ERROR';
        err.status = status;
        throw err;
    }
    // Some providers return an error object instead of HTTP error
    if (resp.data?.error) {
        const upstream = resp.data.error?.message || JSON.stringify(resp.data.error);
        console.error(`[aey-analyze] OpenRouter provider error:`, upstream);
        const err = new Error(`OpenRouter (${model}): ${upstream}`);
        err.code = 'OPENROUTER_ERROR';
        throw err;
    }
    // Wrap into Gemini-like response structure so downstream code works unchanged
    let text = resp.data?.choices?.[0]?.message?.content || '{}';
    // Strip markdown code fences if model wrapped JSON in ```json ... ```
    text = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    // Some models append chatter after the JSON object (e.g. "Here's the JSON: {...}\nNote: ...").
    // Extract the first balanced {...} block using brace-depth counting (string-aware).
    const firstBrace = text.indexOf('{');
    if (firstBrace !== -1) {
        let depth = 0, inStr = false, esc = false, end = -1;
        for (let i = firstBrace; i < text.length; i++) {
            const c = text[i];
            if (esc) { esc = false; continue; }
            if (c === '\\') { esc = true; continue; }
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === '{') depth++;
            else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
        }
        if (end !== -1) text = text.slice(firstBrace, end + 1);
    }
    // Validate JSON; if invalid, attempt progressive cleanup so frontend never sees bad JSON
    try {
        JSON.parse(text);
    } catch (parseErr) {
        console.warn(`[aey-analyze] OpenRouter returned invalid JSON: ${parseErr.message}`);
        console.warn(`[aey-analyze] Raw text (first 500 chars):`, text.slice(0, 500));
        let cleaned = text;
        // 1. Remove markdown bold/italic markers around keys/values
        cleaned = cleaned.replace(/\*\*/g, '').replace(/(?<!\\)\*/g, '');
        // 2. Remove trailing commas before } or ]
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
        // 3. Replace smart/curly quotes with straight double quotes
        cleaned = cleaned.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
        // 4. Convert single-quoted JSON strings to double-quoted (basic; skip if values contain double quotes)
        // Match: 'key': 'value' or : 'value'
        cleaned = cleaned.replace(/([{,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'(\s*:)/g, '$1"$2"$3');
        cleaned = cleaned.replace(/(:\s*)'([^'\\]*(?:\\.[^'\\]*)*)'/g, '$1"$2"');
        // 5. Quote unquoted property names: { key: → { "key":
        cleaned = cleaned.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)(\s*:)/g, '$1"$2"$3');
        // 6. Strip control characters that break JSON (except \n, \t which are valid in strings via \\n)
        cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
        try {
            JSON.parse(cleaned);
            console.log(`[aey-analyze] JSON cleanup succeeded`);
            text = cleaned;
        } catch (cleanErr) {
            console.error(`[aey-analyze] JSON cleanup also failed: ${cleanErr.message}`);
            console.error(`[aey-analyze] Cleaned text (first 500 chars):`, cleaned.slice(0, 500));
            // Last resort — wrap original text in a stub so frontend gets a parseable error message
            text = JSON.stringify({
                _parseError: true,
                _rawText: text.slice(0, 1000),
                partName: 'PARSE ERROR',
                materialCost: 0,
                cncCost: 0,
                qty: 1
            });
        }
    }
    return { candidates: [{ content: { parts: [{ text }] } }], usage: resp.data?.usage || {} };
}
// Azure Speech envs removed per configuration simplification

// Auto-start Flask backend (port 5001) for dev if not running
function isPortOpen(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const socket = net.createConnection({ port, host });
        socket.once('connect', () => { socket.end(); resolve(true); });
        socket.once('error', () => resolve(false));
    });
}

async function startFlaskIfNeeded() {
    // Prefer FLASK_PORT env for dev; default to 5002 to avoid collision with packaged EXE using 5001
    const port = parseInt(process.env.FLASK_PORT || '5002', 10);
    const exePath = path.join(__dirname, 'dist', 'CNC-Costify-AI', 'CNC-Costify-AI.exe');
    const serverPy = path.join(__dirname, 'server.py');
    const open = await isPortOpen(port).catch(() => false);
    if (open) return;
    try {
        // Prefer Python in dev to ensure latest server.py routes
        if (fs.existsSync(serverPy)) {
            const isWin = process.platform === 'win32';
            let pythonCmd = process.env.OCC_PYTHON || null;
            if (!pythonCmd && isWin) {
                const home = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || 'C:\\Users\\USER';
                // Search common conda/miniconda env locations for one that has OCC
                const condaCandidates = [
                    // Env var override (already handled above, but kept for reference)
                    // Common miniconda/anaconda env names known to have pythonocc-core
                    path.join(home, 'miniconda3',        'envs', 'cnc',  'python.exe'),
                    path.join(home, 'miniconda3',        'envs', 'occ',  'python.exe'),
                    path.join(home, 'Miniconda3',        'envs', 'cnc',  'python.exe'),
                    path.join(home, 'Miniconda3',        'envs', 'occ',  'python.exe'),
                    path.join(home, 'Miniconda3-occt',   'envs', 'occ',  'python.exe'),
                    path.join(home, 'Miniconda3-occt',   'envs', 'cnc',  'python.exe'),
                    path.join(home, 'anaconda3',         'envs', 'cnc',  'python.exe'),
                    path.join(home, 'anaconda3',         'envs', 'occ',  'python.exe'),
                    'C:\\ProgramData\\miniconda3\\envs\\cnc\\python.exe',
                    'C:\\ProgramData\\Miniconda3\\envs\\cnc\\python.exe',
                ];
                for (const c of condaCandidates) {
                    if (fs.existsSync(c)) { pythonCmd = c; break; }
                }
                if (pythonCmd) {
                    console.log(`[backend] Using OCC Python: ${pythonCmd}`);
                } else {
                    console.warn('[backend] No OCC conda env found — falling back to system python (OCC features may be unavailable)');
                }
            }
            if (!pythonCmd) {
                pythonCmd = isWin ? 'python' : 'python3';
            }
            // Build child environment — inject conda Library/bin into PATH so OCC DLLs load correctly
            const childEnv = { ...process.env, FLASK_PORT: String(port) };
            if (pythonCmd && pythonCmd !== 'python' && pythonCmd !== 'python3') {
                const condaEnvDir = path.dirname(pythonCmd); // …/envs/cnc  (python.exe is directly inside env root)
                const libBin = path.join(condaEnvDir, 'Library', 'bin');
                const mingwBin = path.join(condaEnvDir, 'Library', 'mingw-w64', 'bin');
                const scripts = path.join(condaEnvDir, 'Scripts');
                childEnv.PATH = [libBin, mingwBin, scripts, condaEnvDir, process.env.PATH || ''].join(path.delimiter);
                console.log(`[backend] PATH prefixed with conda Library/bin for OCC DLL loading`);
            }
            const child = spawn(pythonCmd, [serverPy], {
                cwd: __dirname,
                detached: true,
                stdio: 'ignore',
                env: childEnv
            });
            child.unref();
            console.log(`Started backend Python Flask (server.py) on port ${port}`);
        } else if (fs.existsSync(exePath)) {
            const child = spawn(exePath, [], { detached: true, stdio: 'ignore' });
            child.unref();
            console.log('Started backend EXE for Flask on port 5001');
        } else {
            console.error('Backend not found: missing dist EXE and server.py');
        }

        // Health-check loop: confirm backend responds on /api/health
        const checkHealth = () => new Promise((resolve) => {
            const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
                // Drain response quickly
                res.resume();
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(1500, () => { try { req.destroy(); } catch (_) {} resolve(false); });
        });
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        let ok = false;
        for (let attempt = 1; attempt <= 12; attempt++) {
            ok = await checkHealth();
            if (ok) {
                console.log(`Flask backend health: OK (attempt ${attempt})`);
                break;
            }
            if (attempt === 1) {
                console.log('Waiting for Flask backend to become ready...');
            }
            await wait(500);
        }
        if (!ok) {
            console.warn('Flask backend health: NOT READY after retries');
        }
    } catch (e) {
        console.error('Failed to auto-start Flask backend:', e);
    }
}

// Middlewares
app.use(express.static(__dirname));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS for marketing site (Vercel) and dev — allow only known origins
const ALLOWED_ORIGINS = new Set([
    'https://www.cnccostify.cloud',
    'https://cnccostify.cloud',
    'http://localhost:3000',
    'http://localhost:5000',
]);
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'CNC_Costify_AI_V6.html'));
});

// Public installer downloads (large files served directly by Express).
// Files placed in /opt/cnc-costify/backend/downloads/ are publicly fetchable
// at https://api.cnccostify.cloud/downloads/<file>. Browser triggers Save-As
// for unknown content-types which is what we want for .exe installers.
app.use('/downloads', express.static(path.join(__dirname, 'downloads'), {
    fallthrough: false,
    setHeaders: (res, filePath) => {
        // Force download instead of inline open
        const name = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
    },
}));

// Favicon route (use generated multi-resolution ICO)
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'icons', 'app.ico'));
});

// Route for the original version
app.get('/original', (req, res) => {
    res.sendFile(path.join(__dirname, 'CNC Costify AI V5.5.html'));
});

// Route for the Aey Edition
app.get('/aey', (req, res) => {
    res.sendFile(path.join(__dirname, 'PDF_JPG_Costify.html'));
});

// API: Hardware ID for licensing
app.get('/api/hardware_id', (req, res) => {
    try {
        const hw = licenseManager.computeHardwareId();
        if (!hw) return res.status(500).json({ ok: false, error: 'Hardware ID unavailable' });
        return res.json({ ok: true, hardware_id: hw });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

// API: License status check (dev convenience)
app.get('/api/license/status', (req, res) => {
    try {
        const r = licenseManager.validateLicense();
        return res.json(r);
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

// API: License users list for management UI
app.get('/api/license/users', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'license_users.json');
        if (fs.existsSync(usersPath)) {
            const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            return res.json({ ok: true, users });
        }
        // Fallback sample if file missing
        const sample = [
            { id: 'U1001', name: 'สมชาย ใจดี', email: 'somchai@example.com', role: 'Operator', licenseType: 'Basic', status: 'active', expiresAt: '2026-01-01', permissions: ['estimate:view'] },
            { id: 'U1002', name: 'Alice Tan', email: 'alice.tan@example.com', role: 'Engineer', licenseType: 'Pro', status: 'grace', expiresAt: '2025-12-01', permissions: ['estimate:view','estimate:edit'] },
            { id: 'U1003', name: 'Boonmee S.', email: 'boonmee@example.com', role: 'Admin', licenseType: 'Enterprise', status: 'revoked', expiresAt: '2024-08-01', permissions: ['admin:all'] },
            { id: 'U1004', name: 'John Nguyen', email: 'john.nguyen@example.com', role: 'QA', licenseType: 'Basic', status: 'expired', expiresAt: '2025-05-01', permissions: ['estimate:view'] },
            { id: 'U1005', name: 'Rina K.', email: 'rina.k@example.com', role: 'Planner', licenseType: 'Pro', status: 'active', expiresAt: '2027-03-15', permissions: ['estimate:view','reports:view'] }
        ];
        return res.json({ ok: true, users: sample });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

// API: Import license file in dev (writes to chosen target)
app.post('/api/license/import', (req, res) => {
    try {
        const { license, target } = req.body || {};
        if (!license || typeof license !== 'object') {
            return res.status(400).json({ ok: false, error: 'Invalid license JSON' });
        }
        const targets = licenseManager.readLicensePaths();
        let dest = null;
        if (target === 'programData') dest = targets[0];
        else if (target === 'userData') dest = targets[1];
        else if (target === 'cwd') dest = targets[2];
        else dest = targets[1]; // default to userData

        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dest, JSON.stringify(license, null, 2), 'utf8');
        return res.json({ ok: true, path: dest });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

// API: Save to Excel (browser fallback without Electron)
app.post('/api/save-excel', async (req, res) => {
    try {
        const { filePath, headers, row } = req.body || {};
        if (!filePath || !Array.isArray(headers) || !Array.isArray(row)) {
            return res.status(400).json({ ok: false, error: 'Invalid payload' });
        }
        const normalizedHeaders = headers.map(h => (String(h) === 'Sandblast Note' ? 'Condition Note' : h));

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const workbook = new ExcelJS.Workbook();
        if (fs.existsSync(filePath)) {
            await workbook.xlsx.readFile(filePath);
        }
        let sheet = workbook.getWorksheet('Data');
        if (!sheet) {
            sheet = workbook.addWorksheet('Data');
        }
        // sanitize existing header cells
        if (sheet.rowCount >= 1) {
            const r1 = sheet.getRow(1);
            r1.eachCell((cell) => {
                if (cell.value === 'Sandblast Note') cell.value = 'Condition Note';
            });
        }
        if (sheet.rowCount === 0 || sheet.getRow(1).cellCount === 0) {
            sheet.addRow(normalizedHeaders);
        }
        sheet.addRow(row);

        // Auto-backup before overwriting
        try { if (fs.existsSync(filePath)) fs.copyFileSync(filePath, filePath + '.bak'); } catch (_) {}
        await workbook.xlsx.writeFile(filePath);
        return res.json({ ok: true });
    } catch (err) {
        console.error('save-excel error:', err);
        if (err.code === 'EBUSY' || err.code === 'EPERM' || (err.message && err.message.includes('EBUSY'))) {
            return res.status(423).json({ ok: false, error: 'FILE_BUSY', message: '❌ ไฟล์ Excel กำลังเปิดอยู่ กรุณาปิดไฟล์ก่อนแล้วลองใหม่อีกครั้ง' });
        }
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// API: Save PDF/JPG batch results to Excel — always creates a NEW sheet
app.post('/api/save-excel-pdf', async (req, res) => {
    try {
        const { filePath, headers, rows } = req.body || {};
        if (!filePath || !Array.isArray(headers) || !Array.isArray(rows)) {
            return res.status(400).json({ ok: false, error: 'Invalid payload: filePath, headers, rows required' });
        }

        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const workbook = new ExcelJS.Workbook();
        if (fs.existsSync(filePath)) {
            await workbook.xlsx.readFile(filePath);
        }

        // Generate unique sheet name: "PDF DD-MM-YY HH.MM" (max 31 chars, no forbidden chars)
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const sheetLabel = `PDF ${pad(now.getDate())}-${pad(now.getMonth()+1)}-${String(now.getFullYear()).slice(-2)} ${pad(now.getHours())}.${pad(now.getMinutes())}`;
        // Ensure name is unique (append counter if duplicate)
        let sheetName = sheetLabel;
        let counter = 2;
        while (workbook.getWorksheet(sheetName)) {
            sheetName = `${sheetLabel} (${counter++})`;
        }

        const sheet = workbook.addWorksheet(sheetName);

        // Style header row
        const headerRow = sheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        // Detect column roles by header text (works for both TH and EN)
        const isNumericHeader = h => /THB|จำนวน|QTY|Total|รวม|ราคา|ค่า/i.test(String(h || ''));
        const isNotesHeader   = h => /หมายเหตุ|Technical Notes|Notes/i.test(String(h || ''));
        const isNoHeader      = h => /^(No\.?|ลำดับ)$/i.test(String(h || '').trim());
        const numericCols = headers.map((h, i) => isNumericHeader(h) ? i : -1).filter(i => i >= 0);
        const notesColIdx = headers.findIndex(isNotesHeader);
        const noColIdx    = headers.findIndex(isNoHeader);
        const totalColIdx = headers.findIndex(h => /^(รวม|Total)/i.test(String(h || '').trim()));

        // Add data rows (excluding the last grand-total row, which gets special styling)
        const dataRows  = rows.slice(0, -1);
        const totalRow  = rows[rows.length - 1];

        dataRows.forEach(row => {
            const xRow = sheet.addRow(row);
            xRow.alignment = { vertical: 'middle', wrapText: true };
            // Number format on numeric cells + right-align
            numericCols.forEach(ci => {
                const cell = xRow.getCell(ci + 1);
                if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
                cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
            });
            // Center-align "No." column
            if (noColIdx >= 0) {
                xRow.getCell(noColIdx + 1).alignment = { vertical: 'middle', horizontal: 'center' };
            }
        });

        // Grand total row — yellow highlight on total cell + double bottom border
        if (totalRow) {
            const xRow = sheet.addRow(totalRow);
            xRow.alignment = { vertical: 'middle' };
            // Find label cell index (the cell with t.grandTotal text)
            const labelCi = totalRow.findIndex(v => typeof v === 'string' && v.trim() !== '');
            if (labelCi >= 0) {
                const labelCell = xRow.getCell(labelCi + 1);
                labelCell.font = { bold: true };
                labelCell.alignment = { vertical: 'middle', horizontal: 'right' };
            }
            // Total value cell — yellow fill + double bottom border + bold
            if (totalColIdx >= 0) {
                const totalCell = xRow.getCell(totalColIdx + 1);
                totalCell.numFmt = '#,##0.00';
                totalCell.font = { bold: true };
                totalCell.alignment = { vertical: 'middle', horizontal: 'right' };
                totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
                totalCell.border = {
                    top:    { style: 'thin' },
                    bottom: { style: 'double' }
                };
            }
        }

        // Auto-width columns (approximate; cap notes column wider)
        sheet.columns.forEach((col, i) => {
            let maxLen = String(headers[i] || '').length;
            rows.forEach(row => {
                const v = row[i];
                const s = typeof v === 'number' ? v.toFixed(2) : String(v ?? '');
                // For notes, count longest line only (wrapText handles vertical growth)
                const len = (i === notesColIdx)
                    ? Math.min(50, Math.max(...s.split(/\r?\n/).map(line => line.length), 10))
                    : s.length;
                maxLen = Math.max(maxLen, len);
            });
            col.width = (i === notesColIdx)
                ? 50
                : Math.min(Math.max(maxLen + 2, 10), 28);
        });

        // Auto-backup before overwriting
        try { if (fs.existsSync(filePath)) fs.copyFileSync(filePath, filePath + '.bak'); } catch (_) {}
        await workbook.xlsx.writeFile(filePath);
        return res.json({ ok: true, sheetName, rowCount: rows.length });
    } catch (err) {
        console.error('save-excel-pdf error:', err);
        if (err.code === 'EBUSY' || err.code === 'EPERM' || (err.message && err.message.includes('EBUSY'))) {
            return res.status(423).json({ ok: false, error: 'FILE_BUSY', message: '❌ ไฟล์ Excel กำลังเปิดอยู่ กรุณาปิดไฟล์ก่อนแล้วลองใหม่อีกครั้ง' });
        }
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// API: Open native Windows file dialog and return chosen path
// Uses temp-file output to avoid encoding issues; runs in STA thread for WinForms
app.get('/api/browse-excel-dialog', async (req, res) => {
    const ts       = Date.now();
    const tmpOut   = path.join(os.tmpdir(), `cnc_excel_path_${ts}.txt`);
    const tmpScript = path.join(os.tmpdir(), `cnc_browse_${ts}.ps1`);

    // PowerShell script — STA thread, writes result to temp file
    // Fix 1: UTF-8 BOM (\uFEFF) at start so PS5 reads Thai text correctly
    // Fix 2: AttachThreadInput trick steals foreground from Chrome so dialog appears on top
    const tmpOutEsc = tmpOut.replace(/\\/g, '\\\\');
    const psCode = '\uFEFF' + `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# Win32 P/Invoke: AttachThreadInput + SetForegroundWindow
# Required because hidden background process cannot steal foreground from Chrome by default
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class FG {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    public static void Activate(IntPtr hwnd) {
        IntPtr fg = GetForegroundWindow();
        uint fgTid = GetWindowThreadProcessId(fg, out uint dummy);
        uint myTid = GetCurrentThreadId();
        if (fgTid != myTid) AttachThreadInput(myTid, fgTid, true);
        SetForegroundWindow(hwnd);
        if (fgTid != myTid) AttachThreadInput(myTid, fgTid, false);
    }
}
"@

# Owner form: tiny, invisible, TopMost — dialog inherits its z-order
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost       = $true
$owner.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$owner.Size          = New-Object System.Drawing.Size(1, 1)
$owner.ShowInTaskbar = $false
$owner.Opacity       = 0.01
$owner.Show()

# Force the owner (and thus the dialog) to the foreground by stealing input thread
[FG]::Activate($owner.Handle)

$d = New-Object System.Windows.Forms.SaveFileDialog
$d.Title           = 'เลือกหรือสร้างไฟล์ Excel สำหรับ CNC Costify'
$d.Filter          = 'Excel Files (*.xlsx)|*.xlsx|All Files (*.*)|*.*'
$d.DefaultExt      = 'xlsx'
$d.FileName        = 'Cost Data.xlsx'
$d.CheckFileExists = $false
$d.OverwritePrompt = $false
$result = $d.ShowDialog($owner)
$owner.Dispose()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
    [System.IO.File]::WriteAllText('${tmpOutEsc}', $d.FileName, [System.Text.Encoding]::UTF8)
}
`;

    try {
        // Write with UTF-8 encoding (BOM already prepended in psCode string)
        fs.writeFileSync(tmpScript, psCode, 'utf8');

        await new Promise((resolve, reject) => {
            // Run PowerShell in STA mode (required for WinForms dialogs)
            // -WindowStyle Hidden keeps console hidden but NOT the dialog itself
            const child = spawn('powershell.exe',
                ['-STA', '-NoProfile', '-WindowStyle', 'Hidden', '-File', tmpScript],
                { windowsHide: false, detached: false, stdio: 'ignore' }
            );
            child.on('close', resolve);
            child.on('error', reject);
        });

        // Read result from temp file
        let chosen = null;
        if (fs.existsSync(tmpOut)) {
            chosen = fs.readFileSync(tmpOut, 'utf8').trim() || null;
        }

        // Cleanup temp files
        try { fs.unlinkSync(tmpScript); } catch (_) {}
        try { fs.unlinkSync(tmpOut); } catch (_) {}

        if (chosen) {
            return res.json({ ok: true, filePath: chosen });
        } else {
            return res.json({ ok: true, filePath: null, canceled: true });
        }
    } catch (err) {
        console.error('browse-excel-dialog error:', err);
        try { fs.unlinkSync(tmpScript); } catch (_) {}
        try { fs.unlinkSync(tmpOut); } catch (_) {}
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// API: Open in Explorer (browser fallback without Electron)
app.post('/api/open-in-explorer', async (req, res) => {
    try {
        const { filePath } = req.body || {};
        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({ ok: false, error: 'Invalid filePath' });
        }
        // Determine path to open
        let target = filePath;
        const exists = fs.existsSync(filePath);
        if (!exists) {
            target = path.dirname(filePath);
        }
        // On Windows, use explorer.exe; select file if it exists
        const args = exists ? ['/select,', target] : [target];
        const child = spawn('explorer.exe', args, { detached: true, stdio: 'ignore' });
        child.unref();
        return res.json({ ok: true });
    } catch (err) {
        console.error('open-in-explorer error:', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// API: Open file directly (browser fallback without Electron)
app.post('/api/open-file', async (req, res) => {
    try {
        const { filePath } = req.body || {};
        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({ ok: false, error: 'Invalid filePath' });
        }
        // If file exists, open directly; otherwise open its directory
        const exists = fs.existsSync(filePath);
        if (exists) {
            // On Windows, use cmd.exe start with quoted path to handle spaces
            const quoted = `"${filePath}"`;
            const child = spawn('cmd.exe', ['/c', 'start', '""', quoted], { detached: true, stdio: 'ignore' });
            child.unref();
            return res.json({ ok: true });
        } else {
            const dir = path.dirname(filePath);
            const child = spawn('explorer.exe', [dir], { detached: true, stdio: 'ignore' });
            child.unref();
            return res.json({ ok: false, error: 'File not found. Opened directory instead.' });
        }
    } catch (err) {
        console.error('open-file error:', err);
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// API: Remove specified functions from Excel formulas (replace with cached result)
app.post('/api/remove-functions', async (req, res) => {
    try {
        const { filePath, functions } = req.body || {};
        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({ ok: false, error: 'Invalid filePath' });
        }
        if (!Array.isArray(functions) || functions.length === 0) {
            return res.status(400).json({ ok: false, error: 'Invalid functions list' });
        }
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ ok: false, error: 'File not found' });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const targets = functions
            .map((f) => String(f || '').trim())
            .filter((f) => f.length > 0)
            .map((f) => f.toUpperCase());
        if (targets.length === 0) {
            return res.status(400).json({ ok: false, error: 'No valid functions' });
        }
        const regs = targets.map((fn) => new RegExp(`\\b${fn}\\s*\\(`, 'i'));

        let removed = 0;
        let skipped = 0;
        const affected = [];

        workbook.eachSheet((sheet) => {
            sheet.eachRow((row) => {
                row.eachCell({ includeEmpty: false }, (cell) => {
                    const v = cell.value;
                    if (v && typeof v === 'object' && 'formula' in v && v.formula) {
                        const formula = String(v.formula || '');
                        if (regs.some((r) => r.test(formula))) {
                            if (v.result !== undefined && v.result !== null) {
                                cell.value = v.result;
                                removed++;
                                affected.push({ sheet: sheet.name, address: cell.address, formula });
                            } else {
                                skipped++;
                                affected.push({ sheet: sheet.name, address: cell.address, formula, skipped: 'no cached result' });
                            }
                        }
                    }
                });
            });
        });

        // Auto-backup before overwriting
        try { if (fs.existsSync(filePath)) fs.copyFileSync(filePath, filePath + '.bak'); } catch (_) {}
        await workbook.xlsx.writeFile(filePath);

        // Validation: confirm no targeted functions remain in formulas
        const recheck = new ExcelJS.Workbook();
        await recheck.xlsx.readFile(filePath);
        let remaining = 0;
        recheck.eachSheet((sheet) => {
            sheet.eachRow((row) => {
                row.eachCell({ includeEmpty: false }, (cell) => {
                    const v = cell.value;
                    if (v && typeof v === 'object' && 'formula' in v && v.formula) {
                        const formula = String(v.formula || '');
                        if (regs.some((r) => r.test(formula))) {
                            remaining++;
                        }
                    }
                });
            });
        });

        return res.json({ ok: true, removed, skipped, remaining, affected, functions: targets });
    } catch (err) {
        console.error('remove-functions error:', err);
        if (err.code === 'EBUSY' || err.code === 'EPERM' || (err.message && err.message.includes('EBUSY'))) {
            return res.status(423).json({ ok: false, error: 'FILE_BUSY', message: '❌ ไฟล์ Excel กำลังเปิดอยู่ กรุณาปิดไฟล์ก่อนแล้วลองใหม่อีกครั้ง' });
        }
        return res.status(500).json({ ok: false, error: String(err) });
    }
});

// List available Gemini models with supported methods
app.get('/api/models/gemini', async (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || AI_CONFIG.gemini?.api_key;
        if (!apiKey) return res.status(400).json({ ok: false, error: 'GOOGLE_API_KEY/GEMINI_API_KEY not configured' });
        const apiBase = 'https://generativelanguage.googleapis.com';
        async function list(version) {
            const url = `${apiBase}/${version}/models?key=${apiKey}`;
            return axios.get(url, { timeout: 10_000 });
        }
        let models = [];
        try {
            const r = await list('v1');
            models = r.data?.models || [];
        } catch (e) {
            try {
                const r2 = await list('v1beta');
                models = r2.data?.models || [];
            } catch (e2) {
                console.error('list models error:', e2?.response?.data || e2);
                const msg = e2?.response?.data?.error?.message || String(e2.message || e2);
                return res.status(500).json({ ok: false, error: msg });
            }
        }
        const simplified = (models || []).map((m) => {
            const name = m.name || m.model || m.id || '';
            const id = String(name).replace(/^models\//, '');
            const displayName = m.displayName || id;
            const methods = m.supportedGenerationMethods || m.generationMethods || [];
            const canGenerateContent = Array.isArray(methods) && (methods.includes('generateContent') || methods.includes('completions'));
            return { id, displayName, canGenerateContent };
        }).filter((m) => m.id);
        return res.json({ ok: true, models: simplified });
    } catch (err) {
        console.error('list models error:', err?.response?.data || err);
        const msg = err?.response?.data?.error?.message || String(err.message || err);
        return res.status(500).json({ ok: false, error: msg });
    }
});

// --- Lightweight key-status endpoint (used by PDF/JPG page to show live badge) ---
app.get('/api/gemini-key-status', (req, res) => {
    const keys = getGeminiKeys();
    res.json({
        ok: true,
        key_count: keys.length,
        current_key_index: keys.length > 0 ? (_geminiKeyIndex % keys.length) + 1 : 0,
        has_openrouter: !!(AI_CONFIG.openrouter?.api_key || '').trim()
    });
});

// --- AI Provider Config Endpoints ---
app.get('/api/config/ai', (req, res) => {
    try {
        AI_CONFIG = loadAiConfig();
        const geminiKeys = getGeminiKeys();
        const geminiKeysRaw = Array.isArray(AI_CONFIG.gemini?.api_keys)
            ? AI_CONFIG.gemini.api_keys.filter(Boolean)
            : (AI_CONFIG.gemini?.api_key ? [AI_CONFIG.gemini.api_key] : []);
        const out = {
            ok: true,
            provider: AI_CONFIG.provider || 'gemini',
            gemini: {
                model: AI_CONFIG.gemini?.model || 'gemini-1.5-flash',
                key_masked: maskKey(geminiKeysRaw[0] || ''),
                key_count: geminiKeys.length,
                current_key_index: _geminiKeyIndex + 1,  // 1-based for display
                // Return all keys masked for display in textarea
                keys_masked: geminiKeysRaw.map(k => maskKey(k))
            },
            openrouter: {
                model: AI_CONFIG.openrouter?.model || 'qwen/qwen2.5-vl-72b-instruct',
                key_masked: maskKey(AI_CONFIG.openrouter?.api_key || '')
            }
        };
        return res.json(out);
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

app.post('/api/config/ai', (req, res) => {
    try {
        const {
            provider,
            geminiApiKey,    // legacy single-key (compat)
            geminiApiKeys,   // NEW: newline/comma-separated multi-key string
            geminiModel,
            openrouterApiKey,
            openrouterModel
        } = req.body || {};

        AI_CONFIG = loadAiConfig();
        if (provider) AI_CONFIG.provider = String(provider).toLowerCase();
        AI_CONFIG.gemini = AI_CONFIG.gemini || {};
        AI_CONFIG.openrouter = AI_CONFIG.openrouter || {};

        // Handle Gemini multi-key: geminiApiKeys (multi) overrides geminiApiKey (single)
        if (typeof geminiApiKeys === 'string') {
            const trimmed = geminiApiKeys.trim();
            if (trimmed === '') {
                // Explicit empty string → user cleared textarea → CLEAR all keys
                AI_CONFIG.gemini.api_keys = [];
                AI_CONFIG.gemini.api_key = '';
            } else {
                // Split by newline or comma, trim, deduplicate, remove empty
                const keys = geminiApiKeys
                    .split(/[\n,]+/)
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
                if (keys.length > 0) {
                    AI_CONFIG.gemini.api_keys = keys;
                    AI_CONFIG.gemini.api_key = keys[0]; // first key as legacy compat
                }
            }
        } else if (typeof geminiApiKey === 'string' && geminiApiKey.trim()) {
            AI_CONFIG.gemini.api_key = geminiApiKey.trim();
            AI_CONFIG.gemini.api_keys = [geminiApiKey.trim()];
        }
        if (typeof geminiModel === 'string' && geminiModel.trim()) AI_CONFIG.gemini.model = geminiModel.trim();

        // OpenRouter config
        if (typeof openrouterApiKey === 'string') AI_CONFIG.openrouter.api_key = openrouterApiKey.trim();
        if (typeof openrouterModel === 'string' && openrouterModel.trim()) AI_CONFIG.openrouter.model = openrouterModel.trim();

        try {
            saveAiConfig(AI_CONFIG);
        } catch (e) {
            console.error('[POST /api/config/ai] saveAiConfig failed:', e);
            return res.status(500).json({
                ok: false,
                error: `ไม่สามารถบันทึกไฟล์ config ได้: ${e.message}`,
                path: CONFIG_PATH
            });
        }

        // Reset key rotation index so we start fresh from key 0 after config change
        _geminiKeyIndex = 0;

        // Refresh process.env for immediate effect (compat)
        process.env.AI_PROVIDER = AI_CONFIG.provider || 'gemini';
        const firstGeminiKey = getGeminiKeys()[0] || '';
        process.env.GOOGLE_API_KEY = firstGeminiKey;
        process.env.GEMINI_API_KEY = firstGeminiKey;
        process.env.GEMINI_MODEL = AI_CONFIG.gemini?.model || 'gemini-1.5-flash';

        const geminiKeysNow = getGeminiKeys();
        const geminiKeysRawNow = Array.isArray(AI_CONFIG.gemini?.api_keys)
            ? AI_CONFIG.gemini.api_keys.filter(Boolean)
            : (AI_CONFIG.gemini?.api_key ? [AI_CONFIG.gemini.api_key] : []);
        return res.json({
            ok: true,
            provider: process.env.AI_PROVIDER,
            config_path: CONFIG_PATH,
            gemini: {
                model: process.env.GEMINI_MODEL,
                key_masked: maskKey(firstGeminiKey),
                key_count: geminiKeysNow.length,
                current_key_index: 1,
                keys_masked: geminiKeysRawNow.map(k => maskKey(k))
            },
            openrouter: {
                model: AI_CONFIG.openrouter?.model || '',
                key_masked: maskKey(AI_CONFIG.openrouter?.api_key || '')
            }
        });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

// --- AI Chat API (Gemini/OpenRouter) ---
// Lightweight material density database (approximate values)
const MATERIAL_DENSITY_DB = [
    { name: 'Steel (Carbon)', density_kg_m3: 7850, synonyms: ['steel', 'เหล็ก', 's45c', 's50c', 's55c', 'aisi 1045', 'aisi 1018'] },
    { name: 'เหล็ก SS400', density_kg_m3: 7850, synonyms: ['ss400', 'jis ss400', 'เหล็ก ss400'] },
    { name: 'เหล็ก P20 (Plastic Mold Steel)', density_kg_m3: 7800, synonyms: ['p20', 'เหล็ก p20', 'plastic mold steel', 'din 1.2311', '1.2311', '2311'] },
    { name: 'Tool Steel SKD11', density_kg_m3: 7700, synonyms: ['skd11', 'tool steel', 'เอสเคดี11'] },
    { name: 'Stainless Steel 304', density_kg_m3: 8000, synonyms: ['stainless 304', 'stainless', 'สแตนเลส 304', 'sus304', 'ss304'] },
    { name: 'Stainless Steel 316', density_kg_m3: 8000, synonyms: ['stainless 316', 'สแตนเลส 316', 'sus316', 'ss316'] },
    { name: 'Aluminum 6061', density_kg_m3: 2700, synonyms: ['aluminum 6061', 'alu 6061', 'al6061', '6061', 'อลูมิเนียม 6061', 'อลูมิเนียม'] },
    { name: 'Aluminum 7075', density_kg_m3: 2810, synonyms: ['aluminum 7075', 'alu 7075', 'al7075', '7075', 'อลูมิเนียม 7075'] },
    { name: 'Brass', density_kg_m3: 8500, synonyms: ['brass', 'ทองเหลือง'] },
    { name: 'Copper', density_kg_m3: 8960, synonyms: ['copper', 'ทองแดง'] },
    { name: 'Titanium Ti-6Al-4V', density_kg_m3: 4430, synonyms: ['titanium', 'ti6al4v', 'ti-6al-4v', 'ไทเทเนียม'] },
    { name: 'PVC', density_kg_m3: 1400, synonyms: ['pvc', 'พีวีซี'] },
    { name: 'ABS', density_kg_m3: 1050, synonyms: ['abs', 'เอ บี เอส'] },
    { name: 'Nylon (PA6)', density_kg_m3: 1150, synonyms: ['nylon', 'pa6', 'ไนลอน'] },
    { name: 'POM (Delrin/Acetal)', density_kg_m3: 1410, synonyms: ['pom', 'delrin', 'acetal', 'พีโอเอ็ม', 'เดลริน'] },
    { name: 'PEEK', density_kg_m3: 1320, synonyms: ['peek', 'พีอีอีเค'] }
];

function detectMaterialDensity(text) {
    const input = String(text || '').toLowerCase();
    const matches = [];
    for (const entry of MATERIAL_DENSITY_DB) {
        for (const syn of entry.synonyms) {
            const s = String(syn || '').toLowerCase();
            if (!s) continue;
            if (input.includes(s)) {
                matches.push({ material: entry.name, density_kg_m3: entry.density_kg_m3, synonym: syn });
                break;
            }
        }
    }
    return matches;
}
function extractDensityValues(text) {
    const s = String(text || '');
    const num = (x) => {
        if (!x) return undefined;
        const n = String(x).replace(/[,\s]/g, '');
        const v = Number(n);
        return isFinite(v) ? v : undefined;
    };
    const kgMatch = s.match(/([0-9][0-9.,]*)\s*(kg\s*\/\s*m(?:\^?3|³|3))/i);
    const gMatch = s.match(/([0-9][0-9.,]*)\s*(g\s*\/\s*cm(?:\^?3|³|3))/i);
    const kg = num(kgMatch?.[1]);
    const g = num(gMatch?.[1]);
    let kg_m3 = kg;
    let g_cm3 = g;
    if (kg_m3 == null && g_cm3 != null) kg_m3 = g_cm3 * 1000;
    if (g_cm3 == null && kg_m3 != null) g_cm3 = kg_m3 / 1000;
    return { kg_m3, g_cm3 };
}
// Normalize material display for replies (prefer common labels like S45C)
function normalizeMaterialDisplay(match, fallback) {
    const syn = String(match?.synonym || '').trim().toLowerCase();
    if (syn === 's45c') return 'S45C';
    if (syn === 's50c') return 'S50C';
    if (syn === 's55c') return 'S55C';
    if (syn === 'ss400') return 'SS400';
    if (syn === 'skd11') return 'SKD11';
    if (syn === 'p20') return 'P20';
    if (syn === 'sus304') return 'SUS304';
    if (syn === 'sus316') return 'SUS316';
    if (syn === 'al6061' || syn === 'aluminum 6061' || syn === 'alu 6061' || syn === '6061') return 'Aluminum 6061';
    if (syn === 'al7075' || syn === 'aluminum 7075' || syn === 'alu 7075' || syn === '7075') return 'Aluminum 7075';
    if (syn === 'ti6al4v' || syn === 'ti-6al-4v') return 'Titanium Ti-6Al-4V';
    return match?.material || String(fallback || 'วัสดุ');
}
function formatDensityReply(material, kg_m3, g_cm3) {
    const name = String(material || 'วัสดุ');
    const gFmt = (Number(g_cm3 || 0)).toFixed(2);
    const kgFmt = Math.round(Number(kg_m3 || 0)).toLocaleString('en-US');
    return `${name} มีความหนาแน่นประมาณ\n- “🔹 ${gFmt} g/cm³”\n- “🔹 ${kgFmt} kg/m³”`;
}

app.post('/api/material/density', (req, res) => {
    try {
        const { text } = req.body || {};
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ ok: false, error: 'Missing text' });
        }
        const matches = detectMaterialDensity(text);
        return res.json({ ok: true, matches });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});


// --- Material Engineering Skill Integration ---
// Domain-selective loading: each variable holds only what its domain needs
// This avoids injecting ~90KB into every request
let skillPersona    = '';  // SKILL.md — expert persona, response formats, confidence tags
let skillMetals     = '';  // metals.md + metals-alloys.md — full metals database
let skillComposites = '';  // composites.md + ceramics-glass-composites.md
let skillPolymers   = '';  // polymers-plastics.md
let skillCalc       = '';  // calculator.md — volume formulas, weight examples, comparison tables

try {
    const base = path.join(__dirname, 'ai_skills', 'materials-engineering-readable');
    const refs  = path.join(base, 'references');
    const rd = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (_) { return ''; } };

    // Expert persona (SKILL.md in root)
    skillPersona = rd(path.join(base, 'SKILL.md'));

    // Metals — combine new focused file + legacy comprehensive file
    skillMetals = [
        rd(path.join(refs, 'metals.md')),
        rd(path.join(refs, 'metals-alloys.md'))
    ].filter(Boolean).join('\n\n---\n\n');

    // Composites — combine new file + legacy ceramics/glass/composites
    skillComposites = [
        rd(path.join(refs, 'composites.md')),
        rd(path.join(refs, 'ceramics-glass-composites.md'))
    ].filter(Boolean).join('\n\n---\n\n');

    // Polymers & plastics
    skillPolymers = rd(path.join(refs, 'polymers-plastics.md'));

    // Calculator + comparison tables
    skillCalc = rd(path.join(refs, 'calculator.md'));

    const loaded = [skillPersona, skillMetals, skillComposites, skillPolymers, skillCalc].filter(Boolean).length;
    console.log(`[Skill] Materials Engineering skill loaded: ${loaded}/5 sections`);
} catch (e) {
    console.error('[Skill] Failed to load Material Engineering skill:', e);
}

// Helper: build skill block with label
function skillBlock(label, content) {
    return content ? `\n\n=== ${label} ===\n${content}` : '';
}

function buildSystemPrompt(domain) {
    const d = String(domain || '').toLowerCase();

    // Shared: expert identity injected at the top of material domains
    const expertHeader = skillPersona
        ? `\n\nYou have access to the following Materials Engineering Knowledge Base. Use it as your primary reference.\n${skillPersona}`
        : '';

    switch (d) {
        case 'spec':
        case 'material_spec':
            // Full metals + composites + polymers database for spec queries
            return [
                'คุณคือผู้เชี่ยวชาญด้านวัสดุศาสตร์ระดับ PhD เฉพาะทางการผลิต CNC',
                'ตอบเป็นภาษาไทยหรือภาษาเดียวกับที่ผู้ใช้ถาม',
                'ให้ข้อมูล spec ครบถ้วน: Tensile Strength, Yield Strength, Hardness, Standard (ASTM/JIS/DIN), Machinability, Weldability, ข้อควรระวัง',
                'ใช้ format จาก Knowledge Base เสมอ ระบุ Confidence: ✅ High / ⚠️ Medium / ❓ Low ทุกครั้ง',
                expertHeader,
                skillBlock('METALS & ALLOYS DATABASE', skillMetals),
                skillBlock('COMPOSITES & ADVANCED MATERIALS', skillComposites),
                skillBlock('POLYMERS & PLASTICS', skillPolymers),
            ].join('\n');

        case 'substitute':
        case 'material_substitute':
            // Metals + composites + cost index for substitution
            return [
                'คุณคือผู้เชี่ยวชาญด้านวัสดุทดแทนระดับ PhD เฉพาะทางการผลิต CNC',
                'ตอบเป็นภาษาไทยหรือภาษาเดียวกับที่ผู้ใช้ถาม',
                'เมื่อแนะนำวัสดุทดแทน ให้ระบุ: ทำไมเหมาะสม, ความแตกต่างหลัก (pros/cons), การเปลี่ยนแปลงกระบวนการ, ผลกระทบด้านราคา (lower/similar/higher)',
                'แนะนำ 2–3 ทางเลือกเสมอ จัดเรียงตามความเหมาะสม',
                expertHeader,
                skillBlock('METALS SUBSTITUTION GUIDE', skillMetals),
                skillBlock('COMPOSITES SUBSTITUTION GUIDE', skillComposites),
                skillBlock('COST INDEX REFERENCE', skillCalc),
            ].join('\n');

        case 'density':
            // Calculator + density tables for weight/density queries
            return [
                'คุณคือผู้เชี่ยวชาญด้านความหนาแน่น/คำนวณน้ำหนักสำหรับงาน CNC',
                'กฎ DENSITY ONLY: เมื่อผู้ใช้ถามเฉพาะความหนาแน่น ตอบตามรูปแบบ EXACT:',
                '  {วัสดุ} มีความหนาแน่นประมาณ\n  - “🔹 {X.XX g/cm³}”\n  - “🔹 {X,XXX kg/m³}”',
                'กฎ WEIGHT CALC: เมื่อมีรูปร่าง/มิติ แสดงสูตร Volume → คำนวณทีละขั้นตอน → ผลลัพธ์เป็น kg และ lbs',
                'กฎหน่วย: g/cm³ = kg/m³ ÷ 1000; ปัดเศษ g/cm³ = 2 ตำแหน่ง, kg/m³ = จำนวนเต็มพร้อมคอมมา',
                expertHeader,
                skillBlock('WEIGHT CALCULATOR & FORMULAS', skillCalc),
            ].join('\n');

        default:
            // General CNC assistant — lightweight (persona only, no heavy refs)
            return [
                'คุณคือผู้ช่วย AI ผู้เชี่ยวชาญสำหรับงาน CNC และวัสดุศาสตร์',
                'ตอบเป็นภาษาไทยหรือภาษาเดียวกับที่ผู้ใช้ถาม กระชับ ตรงประเด็น มีเหตุผล',
                'แนะนำขั้นตอนถัดไปที่เป็นรูปธรรมเสมอ',
                expertHeader,
            ].join('\n');
    }
}

// --- Ollama Local LLM Client ---

/**
 * Check if Ollama is running locally and has a vision model available.
 * @param {string} modelPrefix - Model name prefix to look for (default 'qwen2.5vl')
 * @returns {Promise<{available: boolean, model: string|null}>}
 */
async function isOllamaAvailable(modelPrefix = 'qwen2.5vl') {
    try {
        const http = require('http');
        const data = await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:11434/api/tags', { timeout: 2000 }, (resp) => {
                let body = '';
                resp.on('data', c => body += c);
                resp.on('end', () => {
                    try { resolve(JSON.parse(body)); } catch { reject(new Error('parse error')); }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        });
        const models = data.models || [];
        // Find best matching model: prefer the prefix match
        const found = models.find(m => m.name && m.name.startsWith(modelPrefix));
        if (found) return { available: true, model: found.name };
        // Also accept any vision-capable model as fallback
        const fallback = models.find(m => m.name && /vision|vl|llava|moondream/i.test(m.name));
        if (fallback) return { available: true, model: fallback.name };
        return { available: false, model: null };
    } catch {
        return { available: false, model: null };
    }
}

/**
 * Analyze an image/PDF using Ollama local LLM.
 * Sends base64 image to Ollama vision model and returns raw text response.
 * @param {string} base64Image - Base64-encoded image data
 * @param {string} mimeType - MIME type (image/jpeg, image/png, etc.)
 * @param {string} promptText - The analysis prompt
 * @param {string} model - Ollama model name
 * @returns {Promise<string>} Raw text response (should be JSON)
 */
async function analyzeWithOllama(base64Image, mimeType, promptText, model) {
    const http = require('http');
    const isImageType = mimeType && mimeType.startsWith('image/');
    const body = JSON.stringify({
        model,
        prompt: [
            '## CRITICAL — อ่านจาก Title Block ก่อนเสมอ',
            'ก่อนวิเคราะห์ราคา ต้องอ่านและระบุ field ต่อไปนี้ให้ครบทุก field:',
            '- partName: ชื่อชิ้นงาน (REQUIRED — ถ้าไม่มีให้ใช้ชื่อที่เห็นบน drawing หรือ "Unknown Part")',
            '- partNo: Part Number จาก Title Block (ถ้าไม่มีให้ใส่ "" ห้าม null)',
            '- drawingNo: Drawing Number จาก Title Block (ถ้าไม่มีให้ใส่ "" ห้าม null)',
            '- qty: จำนวน (ถ้าไม่มีให้ใส่ 1)',
            'ห้ามเว้นว่าง partName เด็ดขาด — ต้องมีค่าเสมอ',
            '',
            promptText,
            '',
            'ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายหรือ markdown',
        ].join('\n'),
        stream: false,
        options: {
            num_ctx: 4096,      // ลด context window เพื่อประหยัด RAM (~4x น้อยกว่า default)
            num_keep: 0,        // ไม่ cache prompt tokens ข้ามคำขอ
        },
        ...(isImageType ? { images: [base64Image] } : {})
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost', port: 11434, path: '/api/generate',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            timeout: 180000  // 3 min for slow CPU inference
        };
        const req = http.request(options, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) return reject(new Error(parsed.error));
                    resolve(parsed.response || '');
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Ollama request timed out (3 min)')); });
        req.write(body);
        req.end();
    });
}

// GET /api/ollama-status — check if Ollama + vision model is ready
app.get('/api/ollama-status', async (req, res) => {
    try {
        const modelPref = req.query.model || 'qwen2.5vl';
        const status = await isOllamaAvailable(modelPref);
        return res.json({ ok: status.available, model: status.model });
    } catch (err) {
        return res.json({ ok: false, model: null, error: String(err) });
    }
});

// GET /api/ollama-models — list all models installed in Ollama with sizes
app.get('/api/ollama-models', async (req, res) => {
    try {
        const http = require('http');
        const data = await new Promise((resolve, reject) => {
            const req2 = http.get('http://localhost:11434/api/tags', { timeout: 2000 }, (resp) => {
                let body = '';
                resp.on('data', c => body += c);
                resp.on('end', () => { try { resolve(JSON.parse(body)); } catch { reject(new Error('parse')); } });
            });
            req2.on('error', reject);
            req2.on('timeout', () => { req2.destroy(); reject(new Error('timeout')); });
        });
        const models = (data.models || []).map(m => ({
            name: m.name,
            size_gb: Math.round((m.size || 0) / 1e9 * 10) / 10,
        }));
        return res.json({ ok: true, models });
    } catch (err) {
        return res.json({ ok: false, models: [], error: String(err) });
    }
});

app.post('/api/aey-analyze', async (req, res) => {
    try {
        const payload = req.body;
        const offlineMode = payload.offlineMode === true;
        const preferredModel = (typeof payload.ollamaModel === 'string' && payload.ollamaModel.trim()) ? payload.ollamaModel.trim() : null;
        const keys = getGeminiKeys();

        // Strip our custom fields before forwarding to Gemini API (Gemini rejects unknown fields)
        const { offlineMode: _om, ollamaModel: _oM, ...geminiPayload } = payload;

        // Extract image data and prompt from Gemini-format payload
        let base64Image = null;
        let mimeType = null;
        let promptText = null;
        try {
            const parts = payload?.contents?.[0]?.parts || [];
            const imgPart = parts.find(p => p.inlineData);
            base64Image = imgPart?.inlineData?.data || null;
            mimeType = imgPart?.inlineData?.mimeType || null;
            const systemParts = payload?.systemInstruction?.parts || [];
            promptText = systemParts.map(p => p.text).join('\n');
        } catch { /* ignore extraction errors, let Gemini handle it */ }

        // Ollama / Offline tier removed — Gemini + OpenRouter (auto-fallback) only

        // --- Gemini API (primary) → OpenRouter (auto-fallback) ---
        const hasOpenRouter = !!(AI_CONFIG.openrouter?.api_key || '').trim();
        const orModel = AI_CONFIG.openrouter?.model || 'qwen/qwen2.5-vl-72b-instruct';

        if (keys.length === 0 && !hasOpenRouter) {
            return res.status(400).json({ ok: false, error: 'No API key configured — กรุณาตั้งค่า Gemini หรือ OpenRouter ในหน้า Settings' });
        }

        const modelName = AI_CONFIG.gemini?.model || 'gemini-2.0-flash-exp';
        let responseData;

        // Always use the user-selected OpenRouter model (no silent fallback to a different model)
        if (keys.length === 0) {
            // No Gemini keys → go straight to OpenRouter with user's chosen model
            console.warn(`[aey-analyze] No Gemini key → using OpenRouter (${orModel})`);
            const data = await callOpenRouterForAnalysis(geminiPayload, orModel);
            responseData = data;
            responseData._provider = 'openrouter';
            responseData._model = orModel;
        } else {
            try {
                responseData = await callGeminiWithRotation(geminiPayload, modelName);
            } catch (geminiErr) {
                // Fall back to OpenRouter on ANY Gemini error when OpenRouter is configured —
                // but stick with the user's chosen model (don't auto-switch to a different one)
                if (hasOpenRouter) {
                    const status = geminiErr?.response?.status;
                    const reason = geminiErr.code || `HTTP ${status || 'error'}`;
                    console.warn(`[aey-analyze] Gemini failed (${reason}) → OpenRouter fallback (${orModel})`);
                    const data = await callOpenRouterForAnalysis(geminiPayload, orModel);
                    responseData = data;
                    responseData._provider = 'openrouter';
                    responseData._model = orModel;
                } else {
                    throw geminiErr;
                }
            }
        }

        const usedModel = responseData._model || (responseData._provider === 'openrouter' ? orModel : modelName);
        responseData = await _injectCostMetadata(responseData, usedModel);
        return res.json({ ...responseData, _engine: responseData._provider || 'gemini', _provider: responseData._provider || 'gemini', _model: usedModel });
    } catch (err) {
        const errData = err?.response?.data || String(err);
        const errCode = err?.code || '';
        console.error('[aey-analyze] error:', errData);
        const friendlyMsg = errCode === 'ALL_KEYS_EXHAUSTED'
            ? 'Gemini quota เต็มทุก key และ OpenRouter fallback ใช้ไม่ได้ — กรุณาเพิ่ม API key หรือตรวจสอบ OpenRouter key'
            : errCode === 'NO_KEYS'
                ? 'ยังไม่ได้ตั้งค่า API key — กรุณาไปที่ Settings → ตั้งค่า API'
                : errCode === 'NO_OPENROUTER_KEY'
                    ? 'OpenRouter API key ไม่ถูกต้อง — กรุณาตรวจสอบ key ที่หน้า Settings'
                    : errCode === 'OPENROUTER_ERROR'
                        ? `OpenRouter ตอบกลับ error: ${err.message?.replace(/^OpenRouter\s*\([^)]+\):\s*/, '') || 'unknown'} — ลองเปลี่ยนโมเดลใน Settings (แนะนำ Qwen 2.5-VL 72B)`
                        : null;
        return res.status(500).json({
            ok: false,
            error: errData,
            ...(friendlyMsg ? { friendly: friendlyMsg } : {})
        });
    }
});

// --- Chat rate limiter (per-IP sliding window, 30 req/min) ---
const _chatRateBuckets = new Map();
function _checkChatRateLimit(req) {
    // Only trust X-Forwarded-For from loopback (local use / trusted reverse proxy)
    const remoteAddr = req.socket.remoteAddress || '';
    const isLoopback = /^(127\.|::1$|::ffff:127\.)/.test(remoteAddr);
    const ip = isLoopback
        ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || remoteAddr)
        : remoteAddr;

    const now = Date.now();
    // Prune stale entries to avoid memory leak (keep max 500 IPs)
    if (_chatRateBuckets.size > 500) {
        for (const [k, v] of _chatRateBuckets) {
            if (now - v.ts > 120_000) _chatRateBuckets.delete(k);
        }
    }
    const bucket = _chatRateBuckets.get(ip) || { ts: now, count: 0 };
    if (now - bucket.ts > 60_000) { bucket.ts = now; bucket.count = 0; }
    bucket.count++;
    _chatRateBuckets.set(ip, bucket);
    return bucket.count > 30; // true = limit exceeded
}

app.post('/api/chat', async (req, res) => {
    try {
        const { provider, messages, domain } = req.body || {};
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ ok: false, error: 'Invalid messages payload' });
        }

        // Rate-limit guard (per-IP, sliding window, 30 req/min)
        if (_checkChatRateLimit(req)) {
            return res.status(429).json({ ok: false, error: 'Too many requests — กรุณารอสักครู่แล้วลองใหม่' });
        }

        const p = String(provider || process.env.AI_PROVIDER || AI_CONFIG.provider || 'gemini').toLowerCase();
        const system = buildSystemPrompt(domain);
        const timeoutMs = 20_000;
        const sanitized = messages
            .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 4000) }))
            .filter((m) => m.content.length > 0);

        // Density-on-name: if domain is density and user typed only a material name, answer instantly
        if (String(domain || '').toLowerCase() === 'density') {
            const lastUserMsg = [...sanitized].reverse().find((m) => m.role === 'user');
            const text = lastUserMsg?.content || '';
            const matches = detectMaterialDensity(text);
            if (matches && matches.length > 0) {
                const m = matches[0];
                const display = normalizeMaterialDisplay(m, text);
                const kg_m3 = Number(m.density_kg_m3);
                const g_cm3 = kg_m3 / 1000;
                const reply = formatDensityReply(display, kg_m3, g_cm3);
                return res.json({ ok: true, provider: 'local', text: reply });
            }
        }

        if (p === 'gemini') {
            const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || AI_CONFIG.gemini?.api_key;
            if (!apiKey) return res.status(400).json({ ok: false, error: 'GOOGLE_API_KEY/GEMINI_API_KEY not configured' });
            const model = process.env.GEMINI_MODEL || AI_CONFIG.gemini?.model || 'gemini-1.5-flash';
            // Build contents from conversation only (no system prompt mixed in)
            const contents = sanitized.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            // Use systemInstruction top-level field — Gemini treats this as true system prompt
            // (more reliable than injecting as first user turn)
            const payload = { contents };
            if (system) {
                payload.systemInstruction = { parts: [{ text: system }] };
            }
            const apiBase = 'https://generativelanguage.googleapis.com';
            async function callGemini(version) {
                const url = `${apiBase}/${version}/models/${model}:generateContent?key=${apiKey}`;
                return axios.post(url, payload, { timeout: timeoutMs });
            }
            let resp;
            try {
                resp = await callGemini('v1beta');
            } catch (err) {
                const status = err?.response?.data?.error?.status || '';
                const code = err?.response?.data?.error?.code || err?.response?.status;
                const message = err?.response?.data?.error?.message || '';
                const modelNotFound = status === 'NOT_FOUND' || (code === 404) || /not found|not supported/i.test(String(message || ''));
                if (modelNotFound) {
                    try {
                        resp = await callGemini('v1');
                    } catch (err2) {
                        throw err2;
                    }
                } else {
                    throw err;
                }
            }
            const parts = resp.data?.candidates?.[0]?.content?.parts || [];
            let text = parts.map((p) => p.text || '').join('');
            if (String(domain || '').toLowerCase() === 'density') {
                const lastUserMsg = [...sanitized].reverse().find((m) => m.role === 'user');
                const userText = lastUserMsg?.content || '';
                const match = detectMaterialDensity(userText)?.[0];
                const material = match ? normalizeMaterialDisplay(match, userText) : userText;
                const parsed = extractDensityValues(text);
                if (parsed.kg_m3 || parsed.g_cm3) {
                    text = formatDensityReply(material, parsed.kg_m3, parsed.g_cm3);
                } else if (match?.density_kg_m3) {
                    const kg = Number(match.density_kg_m3);
                    text = formatDensityReply(material, kg, kg / 1000);
                }
            }
            return res.json({ ok: true, provider: 'gemini', text });
        } else {
            return res.status(400).json({ ok: false, error: 'Unsupported provider' });
        }
    } catch (err) {
        console.error('chat error:', err?.response?.data || err);
        const msg = err?.response?.data?.error?.message || String(err.message || err);
        return res.status(500).json({ ok: false, error: msg });
    }
});

// ─── Feedback API (Phase 1: feature suggestions, bug reports) ──────────────
// MUST be defined BEFORE the catch-all /api/* proxy below — otherwise the
// proxy will swallow these requests and forward them to Flask (which doesn't have them).
const feedbackDb = require('./lib/feedbackDb');

// Rate limit: max 5 submissions per IP per hour
const _feedbackBuckets = new Map();
const _FEEDBACK_LIMIT = 5;
const _FEEDBACK_WINDOW_MS = 60 * 60 * 1000;
function _checkFeedbackRateLimit(ip) {
    const now = Date.now();
    const b = _feedbackBuckets.get(ip);
    if (!b || now > b.resetAt) {
        _feedbackBuckets.set(ip, { count: 1, resetAt: now + _FEEDBACK_WINDOW_MS });
        return true;
    }
    if (b.count >= _FEEDBACK_LIMIT) return false;
    b.count += 1;
    return true;
}

app.post('/api/feedback/suggest', (req, res) => {
    try {
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        const ua = String(req.headers['user-agent'] || '').slice(0, 500);

        if (!_checkFeedbackRateLimit(ip)) {
            return res.status(429).json({ ok: false, error: 'rate_limit', message: 'Too many submissions — please try again later' });
        }

        const body = req.body || {};
        const category = String(body.category || '').trim();
        const title = String(body.title || '').trim();
        const description = String(body.description || '').trim();
        const importance = parseInt(body.importance, 10) || 3;
        const name = body.name ? String(body.name).trim().slice(0, 200) : '';
        const email = body.email ? String(body.email).trim().slice(0, 200) : '';
        const locale = body.locale ? String(body.locale).slice(0, 10) : '';
        const page = body.page ? String(body.page).slice(0, 500) : '';

        if (!feedbackDb.VALID_CATEGORIES.has(category)) {
            return res.status(400).json({ ok: false, error: 'invalid_category' });
        }
        if (!title || title.length > 200) {
            return res.status(400).json({ ok: false, error: 'invalid_title' });
        }
        if (!description || description.length > 5000) {
            return res.status(400).json({ ok: false, error: 'invalid_description' });
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ ok: false, error: 'invalid_email' });
        }

        const id = feedbackDb.insertFeedback({
            category, title, description, importance, name, email, locale, page, ip, user_agent: ua,
        });
        console.log(`[feedback] new submission #${id} (${category}): ${title}`);
        return res.json({ ok: true, id });
    } catch (err) {
        console.error('[feedback/suggest] failed:', err);
        return res.status(500).json({ ok: false, error: 'server_error', message: String(err) });
    }
});

// ─── Auth API (Phase 2.1: signup / login / session) ────────────────────────
// Phase 2.2 adds: verify-email, resend-verify, forgot-password, reset-password (via SMTP).
const authDb = require('./lib/authDb');
const emailLib = require('./lib/email');

const COOKIE_NAME = 'cnc_session';
const COOKIE_REMEMBER_AGE = 30 * 24 * 60 * 60;  // 30 days
const COOKIE_SHORT_AGE    = 24 * 60 * 60;       // 1 day
function _setSessionCookie(res, token, maxAgeSec = COOKIE_REMEMBER_AGE) {
    const isProd = process.env.NODE_ENV === 'production';
    const flags = [
        `${COOKIE_NAME}=${token}`,
        'Path=/',
        'HttpOnly',
        `Max-Age=${maxAgeSec}`,
        'SameSite=Lax',
    ];
    if (isProd) flags.push('Secure');
    // Append (don't overwrite) so we can also send oauth_state/clear cookies in same response
    const existing = res.getHeader('Set-Cookie');
    const next = flags.join('; ');
    if (Array.isArray(existing)) res.setHeader('Set-Cookie', [...existing, next]);
    else if (existing) res.setHeader('Set-Cookie', [existing, next]);
    else res.setHeader('Set-Cookie', next);
}
function _clearSessionCookie(res) {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`);
}
function _readCookie(req, name) {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
}
// Middleware: require valid JWT cookie → req.user
function requireAuth(req, res, next) {
    const token = _readCookie(req, COOKIE_NAME) || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ ok: false, error: 'unauthenticated' });
    const payload = authDb.verifyJWT(token);
    if (!payload) return res.status(401).json({ ok: false, error: 'invalid_token' });
    req.user = payload;
    next();
}

// Rate limit: signup/login = 10 attempts / IP / 15min
const _authBuckets = new Map();
function _checkAuthRateLimit(ip) {
    const now = Date.now();
    const b = _authBuckets.get(ip);
    if (!b || now > b.resetAt) {
        _authBuckets.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
        return true;
    }
    if (b.count >= 10) return false;
    b.count += 1;
    return true;
}

app.post('/api/auth/signup', async (req, res) => {
    try {
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        if (!_checkAuthRateLimit(ip)) {
            return res.status(429).json({ ok: false, error: 'rate_limit' });
        }
        const { email, password, name, company, phone, locale } = req.body || {};
        const { user, verify_token } = await authDb.createUser({ email, password, name, company, phone });
        const token = authDb.issueJWT(user);
        _setSessionCookie(res, token);

        // Send verification email (best-effort — don't block signup if email fails)
        emailLib.sendVerifyEmail({
            to: user.email,
            token: verify_token,
            locale: (locale || 'th'),
            name: user.name,
        }).catch(e => console.error('[auth/signup] email send failed:', e.message));

        return res.json({ ok: true, user });
    } catch (err) {
        console.error('[auth/signup] failed:', err.message);
        return res.status(400).json({ ok: false, error: err.message || 'signup_failed' });
    }
});

// ─── Email verification ───────────────────────────────────────────────────
app.post('/api/auth/verify-email', (req, res) => {
    try {
        const { token } = req.body || {};
        if (!token) return res.status(400).json({ ok: false, error: 'missing_token' });
        const userId = authDb.verifyEmailToken(token);
        if (!userId) return res.status(400).json({ ok: false, error: 'invalid_or_expired_token' });

        // Send welcome email (best-effort)
        const user = authDb.findUserById(userId);
        if (user) {
            const locale = (req.body.locale || 'th');
            emailLib.sendWelcomeEmail({ to: user.email, locale, name: user.name })
                .catch(e => console.error('[auth/verify] welcome email failed:', e.message));
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('[auth/verify-email] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'verify_failed' });
    }
});

app.post('/api/auth/resend-verify', requireAuth, async (req, res) => {
    try {
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        if (!_checkAuthRateLimit(ip)) {
            return res.status(429).json({ ok: false, error: 'rate_limit' });
        }
        const user = authDb.findUserById(req.user.sub);
        if (!user) return res.status(404).json({ ok: false, error: 'user_not_found' });
        if (user.verified) return res.json({ ok: true, already_verified: true });

        // Generate fresh token if missing
        let verifyToken = user.verify_token;
        if (!verifyToken) {
            const crypto = require('crypto');
            verifyToken = crypto.randomBytes(32).toString('hex');
            feedbackDb.getDb().prepare('UPDATE users SET verify_token = ? WHERE id = ?')
                .run(verifyToken, user.id);
        }
        await emailLib.sendVerifyEmail({
            to: user.email,
            token: verifyToken,
            locale: (req.body?.locale || 'th'),
            name: user.name,
        });
        return res.json({ ok: true });
    } catch (err) {
        console.error('[auth/resend-verify] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'send_failed' });
    }
});

// ─── Password reset ───────────────────────────────────────────────────────
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        if (!_checkAuthRateLimit(ip)) {
            return res.status(429).json({ ok: false, error: 'rate_limit' });
        }
        const { email, locale } = req.body || {};
        if (!email) return res.status(400).json({ ok: false, error: 'missing_email' });

        const result = authDb.setResetToken(email);
        // Always respond success to avoid leaking which emails exist
        if (result) {
            emailLib.sendResetEmail({
                to: result.user.email,
                token: result.token,
                locale: (locale || 'th'),
                name: result.user.name,
            }).catch(e => console.error('[auth/forgot] email failed:', e.message));
        }
        return res.json({ ok: true });
    } catch (err) {
        console.error('[auth/forgot-password] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'request_failed' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body || {};
        if (!token || !password) return res.status(400).json({ ok: false, error: 'missing_input' });
        if (password.length < 8) return res.status(400).json({ ok: false, error: 'password_too_short' });
        await authDb.consumeResetToken(token, password);
        return res.json({ ok: true });
    } catch (err) {
        const msg = err.message || 'reset_failed';
        const status = ['invalid_token', 'token_expired', 'invalid_input', 'password_too_short'].includes(msg) ? 400 : 500;
        return res.status(status).json({ ok: false, error: msg });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        if (!_checkAuthRateLimit(ip)) {
            return res.status(429).json({ ok: false, error: 'rate_limit' });
        }
        const { email, password, remember } = req.body || {};
        const user = await authDb.authenticate({ email, password });
        if (!user) {
            return res.status(401).json({ ok: false, error: 'invalid_credentials' });
        }
        authDb.updateLastLogin(user.id, ip);
        const expiresIn = remember ? '30d' : '1d';
        const maxAge = remember ? COOKIE_REMEMBER_AGE : COOKIE_SHORT_AGE;
        const token = authDb.issueJWT(user, expiresIn);
        _setSessionCookie(res, token, maxAge);
        return res.json({ ok: true, user: authDb._safeUser(user) });
    } catch (err) {
        console.error('[auth/login] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'login_failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    _clearSessionCookie(res);
    return res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = authDb.findUserById(req.user.sub);
    if (!user) return res.status(404).json({ ok: false, error: 'user_not_found' });
    const safe = authDb._safeUser(user);
    // Phase A: lightweight admin flag — derived from ADMIN_EMAILS env so the
    // navbar can show the 'Admin' menu item only to authorized accounts. The
    // /admin/* endpoints still re-check requireAdmin, so this flag is purely
    // a UI hint, never a permission.
    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    safe.is_admin = adminEmails.includes(String(user.email || '').toLowerCase());
    return res.json({ ok: true, user: safe });
});

// ─── Google OAuth (Phase 2.2 ext) ────────────────────────────────────────
const OAUTH_STATE_COOKIE = 'cnc_oauth_state';
function _appBaseUrl() {
    return (process.env.APP_BASE_URL || 'https://www.cnccostify.cloud').replace(/\/+$/, '');
}
function _googleRedirectUri() {
    return `${_appBaseUrl()}/api/auth/google/callback`;
}

app.get('/api/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return res.status(503).json({ ok: false, error: 'google_oauth_not_configured' });
    }
    const crypto = require('crypto');
    const state = crypto.randomBytes(24).toString('hex');
    const locale = (req.query.locale === 'en' ? 'en' : 'th');
    const remember = req.query.remember === '0' ? '0' : '1';
    // Allow only same-origin path (prevent open-redirect)
    const rawNext = typeof req.query.next === 'string' ? req.query.next : '';
    const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '';
    // Encode locale + remember + next into state cookie payload (simple JSON, base64)
    const statePayload = Buffer.from(JSON.stringify({ s: state, l: locale, r: remember, n: next })).toString('base64url');

    const isProd = process.env.NODE_ENV === 'production';
    const cookieFlags = [
        `${OAUTH_STATE_COOKIE}=${statePayload}`,
        'Path=/',
        'HttpOnly',
        'Max-Age=600', // 10 minutes
        'SameSite=Lax',
    ];
    if (isProd) cookieFlags.push('Secure');
    res.setHeader('Set-Cookie', cookieFlags.join('; '));

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: _googleRedirectUri(),
        response_type: 'code',
        scope: 'openid email profile',
        state: state,
        access_type: 'online',
        prompt: 'select_account',
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

app.get('/api/auth/google/callback', async (req, res) => {
    const errorRedirect = (locale, code) =>
        res.redirect(`/${locale || 'th'}/login?error=${encodeURIComponent(code)}`);
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId || !clientSecret) return errorRedirect('th', 'google_not_configured');

        const { code, state } = req.query || {};
        const stateCookie = _readCookie(req, OAUTH_STATE_COOKIE);
        // Clear state cookie regardless of outcome
        const clearState = `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
        res.setHeader('Set-Cookie', clearState);

        if (!code || !state || !stateCookie) return errorRedirect('th', 'oauth_state_missing');
        let parsed;
        try {
            parsed = JSON.parse(Buffer.from(stateCookie, 'base64url').toString('utf8'));
        } catch (_) {
            return errorRedirect('th', 'oauth_state_invalid');
        }
        if (parsed.s !== state) return errorRedirect(parsed.l || 'th', 'oauth_state_mismatch');
        const locale = parsed.l === 'en' ? 'en' : 'th';

        // Exchange code → tokens
        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: _googleRedirectUri(),
                grant_type: 'authorization_code',
            }).toString(),
        });
        if (!tokenResp.ok) {
            const txt = await tokenResp.text().catch(() => '');
            console.error('[auth/google] token exchange failed:', tokenResp.status, txt);
            return errorRedirect(locale, 'oauth_token_failed');
        }
        const tokenJson = await tokenResp.json();
        const accessToken = tokenJson.access_token;
        if (!accessToken) return errorRedirect(locale, 'oauth_no_access_token');

        // Fetch user profile
        const profResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!profResp.ok) {
            console.error('[auth/google] userinfo failed:', profResp.status);
            return errorRedirect(locale, 'oauth_profile_failed');
        }
        const profile = await profResp.json();
        if (!profile.email) return errorRedirect(locale, 'oauth_no_email');
        if (profile.verified_email === false) return errorRedirect(locale, 'oauth_email_unverified');

        // Find or create
        const user = await authDb.findOrCreateGoogleUser({
            email: profile.email,
            name: profile.name || null,
            picture: profile.picture || null,
        });
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        authDb.updateLastLogin(user.id, ip);

        // Issue JWT — Google login defaults to "remember" (30d)
        const remember = parsed.r !== '0';
        const expiresIn = remember ? '30d' : '1d';
        const maxAge = remember ? COOKIE_REMEMBER_AGE : COOKIE_SHORT_AGE;
        const token = authDb.issueJWT(user, expiresIn);
        _setSessionCookie(res, token, maxAge);

        // Redirect to ?next if safe (same-origin path), else /account
        const nextPath = (typeof parsed.n === 'string' && parsed.n.startsWith('/') && !parsed.n.startsWith('//'))
            ? parsed.n : `/${locale}/account`;
        return res.redirect(nextPath);
    } catch (err) {
        console.error('[auth/google/callback] failed:', err);
        return errorRedirect('th', 'oauth_failed');
    }
});

// ─── Phase B: Desktop ↔ Web link + Quota ─────────────────────────────────
const desktopLink = require('./lib/desktopLink');

// Middleware: validate device_token (sent by Desktop app via Authorization: Bearer)
// Desktop SHOULD also send X-Hardware-ID matching the bound HW (1-device-per-token).
function requireDeviceToken(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ ok: false, error: 'missing_device_token' });
    const fwd = req.headers['x-forwarded-for'] || '';
    const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
    const hwId = req.headers['x-hardware-id'] || null;
    const result = desktopLink.validateDeviceToken(token, ip, hwId);
    if (!result) return res.status(401).json({ ok: false, error: 'invalid_device_token_or_hw_mismatch' });
    req.deviceUser = result.user;
    req.deviceTokenId = result.deviceTokenId;
    req.deviceHardwareId = result.hardwareId;
    next();
}

// 1) Desktop kicks off the auth-link flow → returns a code + URL to open in browser.
app.post('/api/desktop/auth-link/start', (req, res) => {
    try {
        const { os, app_version, device_name, hardware_id } = req.body || {};
        if (!hardware_id || typeof hardware_id !== 'string' || hardware_id.length < 8) {
            return res.status(400).json({ ok: false, error: 'missing_hardware_id' });
        }
        const { code, expiresIn } = desktopLink.startAuthLink({
            os, appVersion: app_version, deviceName: device_name, hardwareId: hardware_id,
        });
        const base = (process.env.APP_BASE_URL || 'https://www.cnccostify.cloud').replace(/\/+$/, '');
        return res.json({
            ok: true,
            code,
            expires_in: expiresIn,
            authorize_url: `${base}/th/desktop-auth?code=${encodeURIComponent(code)}`,
        });
    } catch (err) {
        console.error('[desktop/auth-link/start] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'start_failed' });
    }
});

// 1.5) Web fetches code info (to display Hardware ID + device meta on confirm page)
app.get('/api/desktop/auth-link/info', (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).json({ ok: false, error: 'missing_code' });
    const info = desktopLink.getAuthLinkInfo(String(code));
    if (!info) return res.status(404).json({ ok: false, error: 'code_not_found' });
    return res.json({
        ok: true,
        info: {
            hardware_id: info.hardware_id,
            os: info.os,
            app_version: info.app_version,
            device_name: info.device_name,
            expired: info.expired,
            authorized: info.authorized,
            consumed: !!info.consumed,
        },
    });
});

// 2) Web confirms after user clicks "Authorize" — must be logged in (uses session cookie).
app.post('/api/desktop/auth-link/confirm', requireAuth, (req, res) => {
    try {
        const { code } = req.body || {};
        const fwd = req.headers['x-forwarded-for'] || '';
        const ip = (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') || req.socket.remoteAddress || 'unknown';
        const result = desktopLink.confirmAuthLink({ code, userId: req.user.sub, ip });
        return res.json(result);
    } catch (err) {
        const known = ['invalid_input', 'code_not_found', 'code_expired', 'code_already_used', 'code_already_authorized'];
        const status = known.includes(err.message) ? 400 : 500;
        return res.status(status).json({ ok: false, error: err.message || 'confirm_failed' });
    }
});

// 3) Desktop polls/exchanges to receive the device_token (one-shot).
app.get('/api/desktop/auth-link/exchange', (req, res) => {
    try {
        const code = req.query.code;
        const result = desktopLink.exchangeAuthLink(code);
        if (!result.ok) return res.status(202).json(result); // pending
        return res.json(result);
    } catch (err) {
        const known = ['invalid_input', 'code_not_found', 'code_expired', 'code_already_used'];
        const status = known.includes(err.message) ? 400 : 500;
        return res.status(status).json({ ok: false, error: err.message || 'exchange_failed' });
    }
});

// Profile for desktop (auth = device token)
app.get('/api/desktop/me', requireDeviceToken, (req, res) => {
    const user = req.deviceUser;
    const status = desktopLink.getQuotaStatus(user.id, user.plan);
    return res.json({ ok: true, user, quota: status });
});

// Quota check (no logging — call BEFORE upload)
app.post('/api/quota/check', requireDeviceToken, (req, res) => {
    const requested = Math.max(1, Math.min(100, parseInt(req.body?.requested, 10) || 1));
    const result = desktopLink.checkQuotaForBatch(req.deviceUser.id, req.deviceUser.plan, requested);
    return res.json({ ok: true, ...result });
});

// Desktop reports its local license.dat status (so /account can show "Unlimited via license").
// Called periodically by Desktop after validateLicense(). Bypassed for license.dat=null payloads.
app.post('/api/desktop/report-license', requireDeviceToken, (req, res) => {
    try {
        const { status, expires_at, days_left } = req.body || {};
        const result = desktopLink.reportLocalLicense({
            deviceTokenId: req.deviceTokenId,
            status: status || null,
            expiresAt: expires_at || null,
            daysLeft: typeof days_left === 'number' ? days_left : null,
        });
        return res.json(result);
    } catch (err) {
        const known = ['missing_device_token_id', 'invalid_status'];
        const code = known.includes(err.message) ? 400 : 500;
        return res.status(code).json({ ok: false, error: err.message || 'report_failed' });
    }
});

// Quota log (call AFTER successful processing — 1 file = 1 unit)
app.post('/api/quota/log', requireDeviceToken, (req, res) => {
    try {
        const { file_type, file_name, file_size, page_count } = req.body || {};
        // Enforce: PDF/JPG must be 1 page (no multi-page sneaking)
        if ((String(file_type).toLowerCase() === 'pdf') && page_count && page_count > 1) {
            return res.status(400).json({ ok: false, error: 'pdf_must_be_single_page' });
        }
        // Re-check quota at log time (defense-in-depth — desktop could be tampered)
        const pre = desktopLink.checkQuotaForBatch(req.deviceUser.id, req.deviceUser.plan, 1);
        if (!pre.allowed) {
            return res.status(429).json({ ok: false, error: 'quota_exceeded', ...pre });
        }
        const status = desktopLink.logUsage({
            userId: req.deviceUser.id,
            plan: req.deviceUser.plan,
            fileType: file_type,
            fileName: file_name,
            fileSize: file_size,
            deviceTokenId: req.deviceTokenId,
        });
        return res.json({ ok: true, quota: status });
    } catch (err) {
        const known = ['invalid_file_type'];
        const status = known.includes(err.message) ? 400 : 500;
        return res.status(status).json({ ok: false, error: err.message || 'log_failed' });
    }
});

// User-side: list devices + revoke
app.get('/api/account/devices', requireAuth, (req, res) => {
    const list = desktopLink.listUserDevices(req.user.sub);
    return res.json({ ok: true, devices: list });
});
app.post('/api/account/devices/:id/revoke', requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ ok: false, error: 'invalid_id' });
    const changes = desktopLink.revokeDeviceToken(id, req.user.sub);
    return res.json({ ok: true, revoked: changes > 0 });
});

// User-side: today's quota status (for /account UI).
// If any of the user's devices has reported a valid license.dat, return that
// instead of the Free counter (so the page reflects the actual access level).
app.get('/api/account/quota', requireAuth, (req, res) => {
    const user = authDb.findUserById(req.user.sub);
    if (!user) return res.status(404).json({ ok: false, error: 'user_not_found' });
    const status = desktopLink.getQuotaStatus(user.id, user.plan);
    const bestLocal = desktopLink.getBestLocalLicense(user.id);
    return res.json({
        ok: true,
        quota: status,
        local_license: bestLocal ? {
            status: bestLocal.local_license_status,
            expires_at: bestLocal.local_license_expires_at,
            days_left: bestLocal.local_license_days_left,
            reported_at: bestLocal.local_license_reported_at,
            device_id: bestLocal.id,
            device_name: bestLocal.device_name,
            hardware_id: bestLocal.hardware_id,
        } : null,
    });
});

// Hourly cleanup of expired auth-link codes (best-effort, in-process timer)
setInterval(() => {
    try { desktopLink.cleanupExpiredCodes(); } catch (_) {}
}, 60 * 60 * 1000).unref();

// ─── Phase A: Order / Upgrade Flow ───────────────────────────────────────
const orderManager = require('./lib/orderManager');
const multer = require('multer');
// (fs already required at the top of this file)

// Slip uploads land in /opt/cnc-costify/backend/uploads/slips/<timestamp>-<random>.ext
const _slipDir = path.join(__dirname, 'uploads', 'slips');
try { fs.mkdirSync(_slipDir, { recursive: true }); } catch (_) {}
const _slipUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, _slipDir),
        filename: (req, file, cb) => {
            const ext = (path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '') || '.bin').slice(0, 6);
            const id = require('crypto').randomBytes(8).toString('hex');
            cb(null, `${Date.now()}-${id}${ext}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.mimetype) ||
                   /\.(jpg|jpeg|png|webp|gif|heic|heif|pdf)$/i.test(file.originalname || '');
        cb(null, !!ok);
    },
});

// Admin gate: env-driven (no DB writes needed)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        const email = String(req.user?.email || '').toLowerCase();
        if (!email || !ADMIN_EMAILS.includes(email)) {
            return res.status(403).json({ ok: false, error: 'admin_only' });
        }
        next();
    });
}

// User: list my orders
app.get('/api/order/my', requireAuth, (req, res) => {
    try {
        const orders = orderManager.listUserOrders(req.user.sub);
        return res.json({ ok: true, orders });
    } catch (err) {
        console.error('[order/my] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'list_failed' });
    }
});

// User: create order with slip upload (multipart/form-data: plan + slip)
app.post('/api/order/create', requireAuth, (req, res) => {
    _slipUpload.single('slip')(req, res, async (err) => {
        if (err) {
            const code = err.code === 'LIMIT_FILE_SIZE' ? 'slip_too_large' : 'slip_upload_failed';
            return res.status(400).json({ ok: false, error: code, message: err.message });
        }
        try {
            const plan = String(req.body?.plan || '').toLowerCase();
            if (!orderManager.isValidPlan(plan)) {
                return res.status(400).json({ ok: false, error: 'invalid_plan' });
            }
            const paymentRef = req.body?.payment_ref || null;
            const notes = req.body?.notes || null;
            const hardwareId = (req.body?.hardware_id || '').trim() || null;
            const slipPath = req.file ? `/uploads/slips/${path.basename(req.file.path)}` : null;
            // Slip is required for non-zero plans
            const expectedAmount = orderManager.PLAN_AMOUNT_THB[plan];
            if (expectedAmount && !slipPath) {
                return res.status(400).json({ ok: false, error: 'slip_required' });
            }
            const order = orderManager.createOrder({
                userId: req.user.sub,
                plan,
                slipPath,
                paymentRef,
                notes,
                hardwareId,
            });

            // Best-effort: notify admins
            (async () => {
                for (const adminEmail of ADMIN_EMAILS) {
                    try {
                        await emailLib.sendAdminOrderNotification?.({
                            to: adminEmail,
                            order,
                        });
                    } catch (e) {
                        console.warn('[order/create] admin email failed:', e.message);
                    }
                }
            })().catch(() => {});

            return res.json({ ok: true, order });
        } catch (e) {
            console.error('[order/create] failed:', e.message);
            return res.status(400).json({ ok: false, error: e.message || 'create_failed' });
        }
    });
});

// Static slip serving — admin only (slips can contain sensitive bank info)
app.get('/api/admin/slip/:filename', requireAdmin, (req, res) => {
    const fname = String(req.params.filename || '').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!fname) return res.status(400).json({ ok: false, error: 'invalid_filename' });
    const fpath = path.join(_slipDir, fname);
    if (!fs.existsSync(fpath)) return res.status(404).json({ ok: false, error: 'not_found' });
    res.sendFile(fpath);
});

// Admin: list orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
    try {
        const status = req.query.status || null;
        const limit = Math.min(500, parseInt(req.query.limit, 10) || 100);
        const offset = parseInt(req.query.offset, 10) || 0;
        const orders = orderManager.listOrders({ status, limit, offset });
        return res.json({ ok: true, orders });
    } catch (err) {
        console.error('[admin/orders] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'list_failed' });
    }
});

// Admin: confirm order (issues license + applies plan + emails user)
app.post('/api/admin/orders/:id/confirm', requireAdmin, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        if (!orderId) return res.status(400).json({ ok: false, error: 'invalid_id' });
        const result = orderManager.confirmOrder({
            orderId,
            adminUserId: req.user.sub,
        });
        // Send delivery email (best-effort)
        if (result.order && !result.alreadyConfirmed) {
            try {
                await emailLib.sendLicenseDeliveryEmail?.({
                    to: result.order.user_email,
                    name: result.order.user_name,
                    plan: result.order.plan,
                    license: result.license, // may be null for monthly
                });
            } catch (e) {
                console.warn('[admin/orders/confirm] delivery email failed:', e.message);
            }
        }
        return res.json(result);
    } catch (err) {
        console.error('[admin/orders/confirm] failed:', err.message);
        return res.status(400).json({ ok: false, error: err.message || 'confirm_failed' });
    }
});

// Admin: reject order
app.post('/api/admin/orders/:id/reject', requireAdmin, (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        if (!orderId) return res.status(400).json({ ok: false, error: 'invalid_id' });
        const reason = String(req.body?.reason || '').slice(0, 500);
        const result = orderManager.rejectOrder({
            orderId,
            adminUserId: req.user.sub,
            reason,
        });
        return res.json(result);
    } catch (err) {
        const known = ['order_not_found', 'missing_order'];
        const status = known.includes(err.message) ? 400 : 500;
        return res.status(status).json({ ok: false, error: err.message || 'reject_failed' });
    }
});

// Lookup license metadata (used by /account UI to render the License card)
app.get('/api/account/license-info', requireAuth, (req, res) => {
    try {
        const db = feedbackDb.getDb();
        const lic = db.prepare(`
            SELECT id, license_key, plan, hardware_id, valid_from, valid_until, revoked, created_at
            FROM licenses
            WHERE user_id = ? AND revoked = 0
            ORDER BY created_at DESC LIMIT 1
        `).get(req.user.sub);
        return res.json({ ok: true, license: lic || null });
    } catch (err) {
        console.error('[account/license-info] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'lookup_failed' });
    }
});

// Lookup my license.dat for download (paid plans only)
app.get('/api/account/license-dat', requireAuth, (req, res) => {
    try {
        const db = feedbackDb.getDb();
        const lic = db.prepare(`
            SELECT id, license_key, plan, valid_from, valid_until, license_dat_json
            FROM licenses
            WHERE user_id = ? AND revoked = 0
            ORDER BY created_at DESC LIMIT 1
        `).get(req.user.sub);
        if (!lic) return res.status(404).json({ ok: false, error: 'no_license' });
        // Stream as license.dat download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="license-${lic.license_key}.dat"`);
        return res.send(lic.license_dat_json);
    } catch (err) {
        console.error('[account/license-dat] failed:', err.message);
        return res.status(500).json({ ok: false, error: 'download_failed' });
    }
});

// Admin-only listing (require simple token from env)
app.get('/api/feedback/list', (req, res) => {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!process.env.FEEDBACK_ADMIN_TOKEN || token !== process.env.FEEDBACK_ADMIN_TOKEN) {
        return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    const limit = Math.min(500, parseInt(req.query.limit, 10) || 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const status = req.query.status || null;
    const category = req.query.category || null;
    const items = feedbackDb.listFeedback({ limit, offset, status, category });
    const total = feedbackDb.countFeedback();
    return res.json({ ok: true, total, items });
});

// ── Catch-all proxy: forward remaining /api/* to Flask backend ─────────────
// (must come AFTER all explicit /api/* routes above)
app.all('/api/*', (req, res) => {
    const flaskPort = parseInt(process.env.FLASK_PORT || '5002', 10);
    const options = {
        hostname: '127.0.0.1',
        port: flaskPort,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${flaskPort}` },
    };
    const proxy = http.request(options, (flaskRes) => {
        res.status(flaskRes.statusCode);
        Object.entries(flaskRes.headers).forEach(([k, v]) => { try { res.setHeader(k, v); } catch (_) {} });
        flaskRes.pipe(res, { end: true });
    });
    proxy.on('error', () => res.status(502).json({ ok: false, error: 'Flask backend unavailable' }));
    req.pipe(proxy, { end: true });
});

// Start the server
// When required by Electron main.js (packaged), ELECTRON_RUN_AS_NODE or require.main !== module.
// In that case, Electron already manages the Python backend — skip Flask auto-start.
const _startedByElectron = (typeof process.versions.electron !== 'undefined') || (require.main !== module);

const _expressServer = app.listen(PORT, () => {
    console.log(`[server] Express running on http://localhost:${PORT}`);
    // SKIP_FLASK=1 → don't try to start Python Flask backend (e.g. on VPS where OCC isn't installed).
    // Useful for marketing-site backend that only needs feedback/auth/license endpoints.
    if (!_startedByElectron && !process.env.SKIP_FLASK) {
        // Dev mode (node server.js) — kick off Flask backend automatically
        startFlaskIfNeeded();
    }
});
// Handle listen errors gracefully — avoid crashing the Electron main process.
// EADDRINUSE means another instance (or app) is already listening on PORT;
// in that case we just let the existing server handle requests.
_expressServer.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.warn(`[server] Port ${PORT} already in use — reusing existing server`);
        return;
    }
    console.error('[server] Listen error:', err && err.message ? err.message : err);
});
// Azure Speech TTS ถูกนำออกตามความต้องการของผู้ใช้
