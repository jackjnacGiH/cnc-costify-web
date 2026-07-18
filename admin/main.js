const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map((v) => canonicalize(v)).join(',')}]`;
  const keys = Object.keys(obj).sort();
  const parts = keys.map((k) => `"${k}":${canonicalize(obj[k])}`);
  return `{${parts.join(',')}}`;
}

function isCaptureMode() {
  return process.env.CAPTURE_MANUAL === '1' || process.argv.includes('--capture-manual');
}

function createWindow() {
  const capture = isCaptureMode();
  const win = new BrowserWindow({
    width: capture ? 1280 : 800,
    height: capture ? 840 : 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Admin License Tool',
  });
  win.loadFile(path.join(__dirname, 'renderer.html')).then(() => {
    if (capture) setupManualCapture(win);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-private-key', async () => {
  const res = await dialog.showOpenDialog({
    title: 'Select Private Key (PEM)',
    filters: [{ name: 'PEM', extensions: ['pem'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths?.[0]) return { ok: false, error: 'Canceled' };
  try {
    const pem = fs.readFileSync(res.filePaths[0], 'utf8');
    return { ok: true, pem, path: res.filePaths[0] };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('generate-license', async (event, { payload, privateKeyPem, pubkeyId }) => {
  try {
    if (!privateKeyPem) return { ok: false, error: 'Missing private key' };
    if (!payload || typeof payload !== 'object') return { ok: false, error: 'Invalid payload' };
    const data = Buffer.from(canonicalize(payload), 'utf8');
    const sig = crypto.sign(null, data, privateKeyPem);
    const signature = `base64:${sig.toString('base64')}`;
    const out = {
      payload,
      sig_alg: 'Ed25519',
      pubkey_id: String(pubkeyId || 'admin-key-2025'),
      signature,
    };
    return { ok: true, license: out };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('save-license', async (event, { defaultPath, content }) => {
  try {
    const res = await dialog.showSaveDialog({
      title: 'Save license.dat',
      defaultPath: defaultPath || 'license.dat',
      filters: [{ name: 'JSON', extensions: ['dat', 'json'] }],
    });
    if (res.canceled || !res.filePath) return { ok: false, error: 'Canceled' };
    fs.writeFileSync(res.filePath, JSON.stringify(content, null, 2), 'utf8');
    return { ok: true, path: res.filePath };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

// --- Capture manual screenshots (optional) ---
async function setupManualCapture(win) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const outDir = path.join(__dirname, '..', 'assets', 'manual', 'admin');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch {}

  // Step 1: initial window
  await sleep(300);
  let image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, 'admin_screenshot_01_main.png'), image.toPNG());

  // Step 2: select private key programmatically
  try {
    const pemPath = path.join(__dirname, 'admin_ed25519_private_key.pem');
    const pem = fs.readFileSync(pemPath, 'utf8');
    await win.webContents.executeJavaScript(
      `window.manual && window.manual.setPrivateKeyPem(${JSON.stringify(pem)}, ${JSON.stringify(pemPath)});`
    );
    await sleep(250);
    image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(outDir, 'admin_screenshot_02_key_selected.png'), image.toPNG());
  } catch (e) {
    // ignore if pem missing
  }

  // Step 3: fill form
  await win.webContents.executeJavaScript(
    `window.manual && window.manual.fillForm({
      hardwareId: 'sha256:DEMO-ABC123',
      licenseId: 'LIC-2025-0001',
      durationDays: 365,
      graceDays: 0,
      tolSec: 300,
      mode: 'active',
      pubkeyId: 'admin-key-2025'
    });`
  );
  await sleep(250);
  image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, 'admin_screenshot_03_form.png'), image.toPNG());

  // Step 4: generate and capture preview
  await win.webContents.executeJavaScript(`window.manual && window.manual.generate();`);
  await sleep(400);
  await win.webContents.executeJavaScript(`window.manual && window.manual.scrollToPreview();`);
  await sleep(250);
  image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, 'admin_screenshot_04_preview.png'), image.toPNG());

  // Optional: close after capture
  setTimeout(() => { try { app.quit(); } catch {} }, 200);
}