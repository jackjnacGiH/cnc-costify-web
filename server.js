const express = require('express');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const axios = require('axios');
const { spawn } = require('child_process');
const net = require('net');
const http = require('http');

const expressSession = require('express-session');
require('dotenv').config();
const { setupAuth, isAuthenticated } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// --- AI Provider Config (persistent) ---
const CONFIG_PATH = path.join(__dirname, 'api_config.json');
function loadAiConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
            const cfg = JSON.parse(raw);
            return cfg && typeof cfg === 'object' ? cfg : {};
        }
    } catch (_) { }
    return {
        provider: process.env.AI_PROVIDER || 'gpt',
        openai: {
            api_key: process.env.OPENAI_API_KEY || '',
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            base_url: process.env.OPENAI_BASE_URL || ''
        },
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
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    } catch (e) { console.error('saveAiConfig error', e); }
}
function maskKey(k) {
    const s = String(k || '');
    if (!s) return '';
    if (s.length <= 8) return '****';
    return s.slice(0, 4) + '...' + s.slice(-4);
}
let AI_CONFIG = loadAiConfig();
// Patch process.env from config for runtime use
process.env.AI_PROVIDER = AI_CONFIG.provider || process.env.AI_PROVIDER || 'gpt';
process.env.OPENAI_API_KEY = AI_CONFIG.openai?.api_key || process.env.OPENAI_API_KEY || '';
process.env.OPENAI_MODEL = AI_CONFIG.openai?.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
process.env.GOOGLE_API_KEY = AI_CONFIG.gemini?.api_key || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
process.env.GEMINI_MODEL = AI_CONFIG.gemini?.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
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
                const home = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || 'C:\\Users\\HP';
                const occCandidate = path.join(home, 'Miniconda3-occt', 'envs', 'occ', 'python.exe');
                if (fs.existsSync(occCandidate)) {
                    pythonCmd = occCandidate;
                }
            }
            if (!pythonCmd) {
                pythonCmd = isWin ? 'python' : 'python3';
            }
            const child = spawn(pythonCmd, [serverPy], {
                cwd: __dirname,
                detached: true,
                stdio: 'ignore',
                env: { ...process.env, FLASK_PORT: String(port) }
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
            req.setTimeout(1500, () => { try { req.destroy(); } catch (_) { } resolve(false); });
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
app.use(express.json({ limit: '2mb' }));
app.use(expressSession({ secret: 'cnc-costify-secret', resave: false, saveUninitialized: false }));
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
setupAuth(app);

// Route for the main page
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'CNC_Costify_AI_V6.html'));
});

// Favicon route (use generated multi-resolution ICO)
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'icons', 'app.ico'));
});

// Route for the original version
app.get('/original', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'CNC Costify AI V5.5.html'));
});

// Route for login and register
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
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

        await workbook.xlsx.writeFile(filePath);
        return res.json({ ok: true });
    } catch (err) {
        console.error('save-excel error:', err);
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

// List available OpenAI (GPT) models; filter to chat-compatible; fallback to curated list
app.get('/api/models/openai', async (req, res) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY || AI_CONFIG.openai?.api_key;
        const baseUrlRaw = process.env.OPENAI_BASE_URL || AI_CONFIG.openai?.base_url || 'https://api.openai.com/v1';
        const baseUrl = String(baseUrlRaw).replace(/\/$/, '');
        if (!apiKey) return res.status(400).json({ ok: false, error: 'OPENAI_API_KEY not configured' });
        const isAzure = /\.openai\.azure\.com/i.test(baseUrl);

        function toItem(id) {
            const displayName = id;
            const canChatCompletions = /^(gpt-3\.5-turbo|gpt-4-turbo|gpt-4$|gpt-4o-mini)/.test(id);
            return { id, displayName, canChatCompletions };
        }

        // Curated fallback list (safe for chat/completions)
        const curated = [
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
            'gpt-3.5-turbo'
        ].map(toItem);

        if (isAzure) {
            // Azure listing is deployment-based; dynamic listing varies.
            // To avoid breaking existing flow, return curated list as a safe fallback.
            return res.json({ ok: true, models: curated });
        }

        try {
            const r = await axios.get(`${baseUrl}/models`, {
                headers: { Authorization: `Bearer ${apiKey}` },
                timeout: 10_000
            });
            const raw = Array.isArray(r.data?.data) ? r.data.data : [];
            const items = raw
                .map(m => String(m.id || '').trim())
                .filter(Boolean)
                .map(toItem)
                .filter(m => m.canChatCompletions);
            if (items.length > 0) return res.json({ ok: true, models: items });
            // If API returns no chat-compatible models, use curated
            return res.json({ ok: true, models: curated });
        } catch (e) {
            console.error('list openai models error:', e?.response?.data || e);
            const msg = e?.response?.data?.error?.message || String(e.message || e);
            // On failure, provide curated list so UI remains functional
            return res.status(200).json({ ok: true, models: curated, note: msg });
        }
    } catch (err) {
        const msg = err?.response?.data?.error?.message || String(err.message || err);
        return res.status(500).json({ ok: false, error: msg });
    }
});

// --- AI Provider Config Endpoints ---
app.get('/api/config/ai', (req, res) => {
    try {
        AI_CONFIG = loadAiConfig();
        const out = {
            ok: true,
            provider: AI_CONFIG.provider || 'gpt',
            openai: {
                model: AI_CONFIG.openai?.model || 'gpt-3.5-turbo',
                key_masked: maskKey(AI_CONFIG.openai?.api_key || '')
            },
            gemini: {
                model: AI_CONFIG.gemini?.model || 'gemini-1.5-flash',
                key_masked: maskKey(AI_CONFIG.gemini?.api_key || '')
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
            openaiApiKey,
            openaiModel,
            geminiApiKey,
            geminiModel
        } = req.body || {};

        AI_CONFIG = loadAiConfig();
        if (provider) AI_CONFIG.provider = String(provider).toLowerCase();
        AI_CONFIG.openai = AI_CONFIG.openai || {};
        AI_CONFIG.gemini = AI_CONFIG.gemini || {};
        if (typeof openaiApiKey === 'string') AI_CONFIG.openai.api_key = openaiApiKey.trim();
        if (typeof openaiModel === 'string') AI_CONFIG.openai.model = openaiModel.trim();
        if (typeof geminiApiKey === 'string') AI_CONFIG.gemini.api_key = geminiApiKey.trim();
        if (typeof geminiModel === 'string') AI_CONFIG.gemini.model = geminiModel.trim();

        saveAiConfig(AI_CONFIG);
        // Refresh process.env for immediate effect
        process.env.AI_PROVIDER = AI_CONFIG.provider || process.env.AI_PROVIDER || 'gpt';
        process.env.OPENAI_API_KEY = AI_CONFIG.openai?.api_key || '';
        process.env.OPENAI_MODEL = AI_CONFIG.openai?.model || 'gpt-3.5-turbo';
        process.env.GOOGLE_API_KEY = AI_CONFIG.gemini?.api_key || '';
        process.env.GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
        process.env.GEMINI_MODEL = AI_CONFIG.gemini?.model || 'gemini-1.5-flash';

        return res.json({
            ok: true,
            provider: process.env.AI_PROVIDER,
            openai: { model: process.env.OPENAI_MODEL, key_masked: maskKey(process.env.OPENAI_API_KEY) },
            gemini: { model: process.env.GEMINI_MODEL, key_masked: maskKey(process.env.GOOGLE_API_KEY) }
        });
    } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
    }
});

// --- AI Chat API (GPT/Gemini) ---
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
function buildSystemPrompt(domain) {
    const d = String(domain || '').toLowerCase();
    switch (d) {
        case 'spec':
        case 'material_spec':
            return 'คุณคือผู้ช่วยด้านสเปควัตถุดิบสำหรับงาน CNC ช่วยอธิบายคุณสมบัติ, มาตรฐาน, ช่วงค่าทางกล, ความเหมาะสมต่อกระบวนการ และข้อควรระวังในการใช้งาน โดยตอบให้กระชับและอ้างอิงแหล่งข้อมูลที่ใช้ทั่วไปเมื่อเหมาะสม.';
        case 'substitute':
        case 'material_substitute':
            return 'คุณคือผู้ช่วยแนะนำวัสดุทดแทน ช่วยเปรียบเทียบคุณสมบัติ, ความสามารถในการผลิต, ความคงทน, ราคาโดยประมาณ และความเสี่ยง/ข้อควรระวัง พร้อมแนะนำทางเลือกที่เหมาะสมตามเงื่อนไข.';
        case 'density':
            return [
                'คุณคือผู้ช่วยความหนาแน่น/คำนวณน้ำหนักสำหรับงาน CNC.',
                'เมื่อผู้ใช้ถามหาความหนาแน่นของวัสดุเพียงอย่างเดียว ให้ตอบเป็นภาษาไทยตามรูปแบบ EXACT นี้เท่านั้น (ห้ามเพิ่มข้อความอื่นก่อน/หลัง):',
                '{วัสดุ} มีความหนาแน่นประมาณ',
                '- “🔹 {ค่าหน่วย g/cm³}”',
                '- “🔹 {ค่าหน่วย kg/m³}”',
                'กฎการแปลงหน่วย: g/cm³ = (kg/m³) ÷ 1000; ปัดเศษ g/cm³ เป็น 2 ตำแหน่ง และแสดง kg/m³ เป็นจำนวนเต็มพร้อมคอมมา เช่น 7.80 และ 7,800.',
                'หากผู้ใช้ระบุรูปร่าง/มิติ ให้คำนวณปริมาตร V และน้ำหนัก W = ρ × V ต่อจากบรรทัดผลลัพธ์ โดยอธิบายขั้นตอนอย่างกระชับและตรวจสอบหน่วยให้ถูกต้อง.',
                'หากข้อมูลไม่ครบ ให้ถามเฉพาะข้อมูลที่จำเป็นเพิ่มเติม'
            ].join(' ');
        default:
            return 'คุณคือผู้ช่วย AI สำหรับงาน CNC ช่วยตอบคำถามอย่างปลอดภัย มีเหตุผล กระชับ และแนะนำขั้นตอนถัดไปที่เป็นรูปธรรม.';
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { provider, messages, domain } = req.body || {};
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ ok: false, error: 'Invalid messages payload' });
        }

        // Basic rate-limit guard (per-IP, naive in-memory)
        // Note: For production, replace with a robust rate limiter (e.g., express-rate-limit + Redis)
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
        global.__chatRate__ = global.__chatRate__ || new Map();
        const now = Date.now();
        const bucket = global.__chatRate__.get(ip) || { ts: now, count: 0 };
        if (now - bucket.ts > 60_000) {
            bucket.ts = now; bucket.count = 0;
        }
        bucket.count++;
        global.__chatRate__.set(ip, bucket);
        if (bucket.count > 30) { // 30 requests/min
            return res.status(429).json({ ok: false, error: 'Too many requests' });
        }

        const p = String(provider || process.env.AI_PROVIDER || AI_CONFIG.provider || 'gpt').toLowerCase();
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

        if (p === 'gpt') {
            const apiKey = process.env.OPENAI_API_KEY || AI_CONFIG.openai?.api_key;
            if (!apiKey) return res.status(400).json({ ok: false, error: 'OPENAI_API_KEY not configured' });
            const model = process.env.OPENAI_MODEL || AI_CONFIG.openai?.model || 'gpt-3.5-turbo';
            const baseUrl = 'https://api.openai.com/v1';
            const payload = {
                model,
                messages: [
                    system ? { role: 'system', content: system } : null,
                    ...sanitized
                ].filter(Boolean),
                temperature: 0.2,
                max_tokens: 800
            };
            const resp = await axios.post(`${baseUrl}/chat/completions`, payload, {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                timeout: timeoutMs
            });
            let text = resp.data?.choices?.[0]?.message?.content || '';
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
            return res.json({ ok: true, provider: 'gpt', text });
        } else if (p === 'gemini') {
            const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || AI_CONFIG.gemini?.api_key;
            if (!apiKey) return res.status(400).json({ ok: false, error: 'GOOGLE_API_KEY/GEMINI_API_KEY not configured' });
            const model = process.env.GEMINI_MODEL || AI_CONFIG.gemini?.model || 'gemini-1.5-flash';
            const contents = [];
            if (system) {
                contents.push({ role: 'user', parts: [{ text: system }] });
            }
            for (const m of sanitized) {
                contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
            }
            const payload = { contents };
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

// Start the server only if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Access the app at: http://localhost:${PORT}`);
        console.log(`Access original version at: http://localhost:${PORT}/original`);
        // Kick off Flask backend if needed (dev convenience)
        startFlaskIfNeeded();
    });
}
// Azure Speech TTS ถูกนำออกตามความต้องการของผู้ใช้

module.exports = app;
