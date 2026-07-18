const { app, BrowserWindow, nativeImage, ipcMain, shell, dialog, Tray, Menu, session, clipboard } = require('electron');
const fs = require('fs');
const net = require('net');
const { spawn, exec } = require('child_process');
const path = require('path');
const licenseManager = require('./licenseManager');
const webAuth = require('./webAuth');
const webSession = require('./webSession');

// Safety net — suppress the native JavaScript error dialog for known-benign
// conditions like EADDRINUSE (port 5000 already in use from a prior instance
// or another app). We log to stderr for diagnostics but never crash.
process.on('uncaughtException', (err) => {
    const code = err && err.code;
    if (code === 'EADDRINUSE' || code === 'EACCES') {
        console.warn('[main] Suppressed non-fatal error:', code, '-', err.message);
        return;
    }
    // Any other unexpected error: just log, don't show dialog
    console.error('[main] uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[main] unhandledRejection:', reason);
});

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'app.ico');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,        // prevent UI collapse on small monitors / aggressive resize
    minHeight: 640,
    useContentSize: true,  // dimensions refer to web content area, not OS chrome
    icon: nativeImage.createFromPath(iconPath),
    title: 'CNC Costify AI V5.13',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Always load via Express server (handles all routes: /, /aey, /api/*)
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}/`;
  win.loadURL(appUrl);
}

// ── Start bundled Express server (serves all HTML + proxies /api/* to Python) ──
let expressStarted = false;
async function startExpressServer() {
  if (expressStarted) return true;
  expressStarted = true;

  const port = parseInt(process.env.PORT || '5000', 10);

  // If port 5000 is already serving (leftover process from a previous run,
  // or a dev-mode server, or a pre-spawned backend), just reuse it — don't
  // try to start another Express or we'll hit EADDRINUSE.
  if (await isPortOpen(port)) {
    console.log(`[Express] Port ${port} already in use — reusing existing server`);
    return true;
  }

  // In packaged mode → Python EXE listens on 5001; tell server.js to proxy there
  if (app.isPackaged) {
    process.env.FLASK_PORT = '5001';
  }

  try {
    require('../server'); // starts Express on PORT (default 5000) within this process
  } catch (e) {
    console.error('[Express] Failed to start server.js:', e);
    return false;
  }

  // Wait up to 10 s for port 5000 to open
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await new Promise(r => setTimeout(r, 150));
  }
  console.warn('[Express] Server did not open port in time — loading anyway');
  return false;
}

// Activation window (license import & hardware ID)
let activationWin = null;
let tray = null;
function createActivationWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'app.ico');
  activationWin = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true,
    alwaysOnTop: false,
    icon: nativeImage.createFromPath(iconPath),
    title: 'Activation – CNC Costify AI V5.13',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  const htmlPath = path.join(__dirname, 'activation.html');
  activationWin.loadFile(htmlPath);
  activationWin.on('closed', () => { activationWin = null; });
}

// Ensure proper taskbar icon on Windows
app.setAppUserModelId('CNC.Costify.AI');

// Register cnc-costify:// custom URL scheme so the website can deep-link the app
// after Web Login. (Web also auto-completes via polling, this is a UX nicety.)
try {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('cnc-costify', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('cnc-costify');
  }
} catch (e) {
  console.warn('[main] setAsDefaultProtocolClient failed:', e && e.message);
}

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => { socket.end(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

async function checkBackendHealth(port = 5001) {
  try {
    const http = require('http');
    return await new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        resolve(res && res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      // Align timeout with frontend health-check (~2500ms)
      req.setTimeout(2500, () => { try { req.destroy(); } catch {} resolve(false); });
    });
  } catch (e) {
    return false;
  }
}

async function waitForBackendReady(port = 5001, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // Prefer health endpoint; if not, at least check port
    const healthy = await checkBackendHealth(port);
    if (healthy) return true;
    const open = await isPortOpen(port);
    if (open) {
      // If some service is on the port but not our health, keep waiting a bit
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function startBackendIfNeeded() {
  const port = 5001;
  // If health OK, nothing to do
  if (await checkBackendHealth(port)) return;

  // In packaged mode, ensure embedded Python runtime exists before spawning EXE
  try {
    // await verifyBackendRuntime(); // Disabled for OneFile build as it blocks startup
  } catch (_) {}

  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, 'CNC-Costify-AI.exe')
    : path.join(__dirname, '..', 'dist', 'CNC-Costify-AI', 'CNC-Costify-AI.exe');
  const projectRoot = path.join(__dirname, '..');
  const serverPy = path.join(projectRoot, 'server.py');

  try {
    if (fs.existsSync(exePath)) {
      const child = spawn(exePath, [], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        cwd: app.isPackaged ? process.resourcesPath : projectRoot
      });
      child.unref();
    } else if (!app.isPackaged && fs.existsSync(serverPy)) {
      // Dev fallback: start Python Flask directly
      const child = spawn(process.platform === 'win32' ? 'python' : 'python3', [serverPy], {
        cwd: projectRoot,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } else {
      console.error('Backend not found: missing EXE in resources and server.py');
    }
  } catch (e) {
    console.error('Failed to start backend:', e);
  }

  // Wait until backend is ready; if not, warn user about port conflict
  const ready = await waitForBackendReady(port, 45000);
  if (!ready) {
    const open = await isPortOpen(port);
    if (open) {
      if (!global.hasShownBackendErrorDialog) {
        global.hasShownBackendErrorDialog = true;
        dialog.showErrorBox('พอร์ต 5001 ถูกใช้งาน', 'มีบริการอื่นใช้พอร์ต 5001 อยู่ ทำให้แบ็กเอนด์เริ่มไม่ได้ กรุณาปิดบริการนั้นแล้วเปิดโปรแกรมใหม่');
      }
    } else {
      if (!global.hasShownBackendErrorDialog) {
        global.hasShownBackendErrorDialog = true;
        dialog.showErrorBox('เริ่มแบ็กเอนด์ไม่สำเร็จ', 'ไม่สามารถเริ่ม CNC Costify AI Backend ได้ โปรดตรวจสอบสิทธิ์การใช้งานไฟล์และโปรแกรมป้องกันไวรัส/Firewall');
      }
    }
  }
}

// Helper for logging retries
function logRetry(message) {
  try {
    const logPath = path.join(app.getPath('userData'), 'CNC_Costify_AI_Log.txt');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (_) {}
}

// Verify that packaged Python runtime exists (PyInstaller / embedded Python)
// Implements infinite retry with logging and delay
async function verifyBackendRuntime() {
  try {
    if (!app.isPackaged) return true; // In dev, skip strict check

    const dirs = [
      path.join(process.resourcesPath, 'internal'),
      path.join(process.resourcesPath, '_internal'),
      path.join(process.resourcesPath, 'lib'),
      path.join(process.resourcesPath, 'lib', 'python3.11'),
      path.join(process.resourcesPath, 'lib', 'python3.10')
    ];
    
    // Cross-platform DLL/Shared Lib patterns
    const dllPatterns = [
      /^python3\d+\.dll$/i,       // Windows
      /^libpython3\.\d+\.so$/i,   // Linux
      /^libpython3\.\d+\.dylib$/i // Mac
    ];

    const specificDlls = [
      'python311.dll', 'python310.dll', 'python3.dll',
      'libpython3.11.so', 'libpython3.10.so', 'libpython3.so',
      'libpython3.11.dylib', 'libpython3.10.dylib', 'libpython3.dylib'
    ];

    let attempt = 0;

    while (true) {
      attempt++;
      let found = false;

      for (const dir of dirs) {
        if (found) break;
        try {
          if (!fs.existsSync(dir)) continue;

          // 1. Check specific names
          for (const name of specificDlls) {
            const p = path.join(dir, name);
            try {
              if (fs.existsSync(p)) {
                // Integrity check
                const stats = fs.statSync(p);
                if (stats.size > 0) {
                  found = true;
                  break;
                } else {
                  logRetry(`Integrity check failed: ${name} size is 0`);
                }
              }
            } catch {}
          }
          if (found) break;

          // 2. Generic scan
          try {
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
              if (dllPatterns.some(regex => regex.test(entry))) {
                const p = path.join(dir, entry);
                const stats = fs.statSync(p);
                if (stats.size > 0) {
                  found = true;
                  break;
                }
              }
            }
          } catch {}
        } catch {}
      }

      if (found) {
        if (attempt > 1) {
          logRetry(`Python runtime DLL found after ${attempt} attempts.`);
        }
        return true;
      }

      // Not found - log and retry
      logRetry(`Attempt ${attempt}: Python runtime DLL not found. Retrying in 1000ms...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (_) {
    return true; // Should not happen in infinite loop, but safe fallback
  }
}

// --- Backend auto-restart & backoff monitor ---
const backendMonitor = {
  state: 'starting', // 'starting' | 'online' | 'offline' | 'restarting' | 'backoff'
  attempt: 0,
  maxAttempts: 6,
  nextDelayMs: 0,
  pollTimer: null,
  backoffTimer: null,
};

function broadcastBackendState() {
  const payload = {
    state: backendMonitor.state,
    attempt: backendMonitor.attempt,
    maxAttempts: backendMonitor.maxAttempts,
    nextDelayMs: backendMonitor.nextDelayMs,
    ts: Date.now(),
  };
  try {
    const wins = BrowserWindow.getAllWindows();
    wins.forEach((w) => {
      try { w.webContents.send('backend-state', payload); } catch {}
    });
  } catch {}
}

function scheduleBackendRestart() {
  // Do not schedule if already waiting or restarting
  if (backendMonitor.state === 'backoff' || backendMonitor.state === 'restarting') return;
  backendMonitor.attempt += 1;
  if (backendMonitor.attempt > backendMonitor.maxAttempts) {
    backendMonitor.state = 'offline';
    backendMonitor.nextDelayMs = 0;
    broadcastBackendState();
    return;
  }
  const base = 2000; // 2s
  const max = 30000; // cap at 30s
  const jitter = Math.floor(Math.random() * 500);
  const delay = Math.min(max, base * Math.pow(2, backendMonitor.attempt - 1)) + jitter;
  backendMonitor.nextDelayMs = delay;
  backendMonitor.state = 'backoff';
  broadcastBackendState();
  if (backendMonitor.backoffTimer) { try { clearTimeout(backendMonitor.backoffTimer); } catch {} }
  backendMonitor.backoffTimer = setTimeout(async () => {
    backendMonitor.state = 'restarting';
    broadcastBackendState();
    try {
      if (await verifyBackendRuntime()) {
        // Fire-and-forget; readiness will be detected by poll
        startBackendIfNeeded().catch(() => {});
      }
    } catch {}
  }, delay);
}

function initBackendMonitor() {
  // Reset state and start polling loop
  backendMonitor.state = 'starting';
  backendMonitor.attempt = 0;
  backendMonitor.nextDelayMs = 0;
  broadcastBackendState();
  if (backendMonitor.pollTimer) { try { clearInterval(backendMonitor.pollTimer); } catch {} }
  backendMonitor.pollTimer = setInterval(async () => {
    let healthy = false;
    try { healthy = await checkBackendHealth(5001); } catch {}
    if (healthy) {
      if (backendMonitor.state !== 'online') {
        backendMonitor.state = 'online';
        backendMonitor.attempt = 0;
        backendMonitor.nextDelayMs = 0;
        broadcastBackendState();
      }
      return;
    }
    // unhealthy
    if (backendMonitor.state === 'online') {
      // Transition from online -> offline
      backendMonitor.state = 'offline';
      broadcastBackendState();
      scheduleBackendRestart();
      return;
    }
    if (backendMonitor.state === 'starting') {
      // initial start failing, schedule restart
      scheduleBackendRestart();
      return;
    }
    // If stuck offline, keep scheduling as needed
    if (backendMonitor.state === 'offline') {
      scheduleBackendRestart();
    }
  }, 3000);
}

// Ensure single instance to avoid duplicate windows and dialogs
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  // Guard to prevent repeated error dialogs per session
  global.hasShownBackendErrorDialog = false;

  app.whenReady().then(async () => {
    // Allow microphone access for the renderer (Electron packaged app)
    try {
      session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        try {
          if (permission === 'media' || permission === 'audioCapture' || permission === 'microphone') {
            return callback(false);
          }
        } catch {}
        return callback(false);
      });
    } catch (_) {}

    // Detect first run for this installed version and force Activation popup
    const userDataDir = app.getPath('userData');
    const prefsPath = path.join(userDataDir, 'prefs.json');
    let postInstall = false;
    try {
      let prefs = {};
      if (fs.existsSync(prefsPath)) {
        try { prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8')); } catch {}
      }
      const currentVersion = app.getVersion();
      if (!prefs.lastRunVersion || prefs.lastRunVersion !== currentVersion) {
        postInstall = true;
        prefs.lastRunVersion = currentVersion;
        try {
          fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
    // Validate offline license. If invalid, show Activation window instead of quitting.
    let licenseOk = false;
    try {
      const result = licenseManager.validateLicense();
      licenseOk = !!(result && result.ok);
      if (licenseOk && result.status === 'grace') {
        dialog.showMessageBox({
          type: 'warning',
          title: 'สิทธิ์การใช้งานใกล้หมดอายุ',
          message: 'สิทธิ์การใช้งานหมดอายุแล้วและอยู่ในช่วงผ่อนผัน กรุณาต่ออายุเพื่อหลีกเลี่ยงการหยุดใช้งาน',
        }).catch(() => {});
      }
    } catch (e) {
      licenseOk = false;
    }

    // Phase B fallback: if no offline license, try web session (signed in via website).
    // Free user (web session, NO license.dat) → REQUIRES INTERNET. We make a quick
    // /me ping; if it fails we still let the activation window open so user can sign in
    // again or check connection, but main UI won't open.
    let webAuthMode = false; // becomes true only when web session is the auth source
    if (!licenseOk) {
      try {
        const session = webSession.loadSession();
        if (session && session.token) {
          const localHw = (() => { try { return licenseManager.computeHardwareId(); } catch { return null; } })();
          const hwOk = !session.hardware_id || (localHw && session.hardware_id.toLowerCase() === String(localHw).toLowerCase());
          if (hwOk) {
            // Try to verify online — Free user with no internet must be blocked.
            try {
              const me = await webAuth.me();
              if (me && me.ok) {
                licenseOk = true;
                webAuthMode = true;
              } else if (me && me.revoked) {
                console.warn('[main] Web session revoked → clearing.');
                webSession.clearSession();
              } else {
                // Network error / server down — block so Free user knows they need internet.
                console.warn('[main] Web session ping failed (likely offline). Free plan needs internet.');
                dialog.showMessageBox({
                  type: 'warning',
                  title: 'ต้องเชื่อมต่ออินเทอร์เน็ต',
                  message: 'แพ็กเกจ Free ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อตรวจสอบสิทธิ์การใช้งาน\n\nกรุณาตรวจสอบการเชื่อมต่อแล้วเปิดโปรแกรมใหม่',
                }).catch(() => {});
              }
            } catch (e) {
              console.warn('[main] webAuth.me() threw:', e && e.message);
            }
          } else {
            console.warn('[main] Web session HW mismatch — clearing.');
            webSession.clearSession();
          }
        }
      } catch (e) {
        console.warn('[main] web session check failed:', e && e.message);
      }
    }

    // Phase B.5.fix + B.6: report license.dat status to backend so /account
    // reflects the actual access level. Runs at startup (3s delay) and every 5 minutes
    // afterwards while the app is open — keeps web /account in sync if license expires
    // or is added/removed at runtime.
    function _reportLicenseNow() {
      try {
        const lic = licenseManager.validateLicense();
        const sess = webSession.loadSession();
        if (sess && sess.token) {
          webAuth.reportLocalLicense({
            status: (lic && lic.ok) ? lic.status : null,
            expires_at: (lic && lic.ok) ? (lic.expires_at || lic.until || null) : null,
            days_left: (lic && lic.ok && typeof lic.days_left === 'number') ? lic.days_left : null,
          }).catch(() => {});
        }
      } catch (_) {}
    }
    setTimeout(_reportLicenseNow, 3000);
    setInterval(_reportLicenseNow, 5 * 60 * 1000).unref?.();

    if (postInstall) {
      // Always show Activation first on newly installed/updated version
      dialog.showMessageBox({
        type: 'info',
        title: 'ติดตั้งเสร็จ — ต้องลงทะเบียนก่อนใช้งาน',
        message: 'โปรดลงทะเบียนหรือเปิดการใช้งานด้วยไฟล์ license.dat ก่อนเข้าใช้งานระบบ',
      }).catch(() => {});
      // Start Express so activation page can still call API if needed
      startExpressServer().catch(() => {});
      createActivationWindow();
    } else if (!licenseOk) {
      // Inform user explicitly to register/activate before use
      dialog.showMessageBox({
        type: 'info',
        title: 'ต้องลงทะเบียนก่อนใช้งาน',
        message: 'โปรดลงทะเบียนหรือเปิดการใช้งานด้วยไฟล์ license.dat ก่อนเข้าใช้งานระบบ',
      }).catch(() => {});
      startExpressServer().catch(() => {});
      createActivationWindow();
    } else {
      // Start Python backend (non-blocking — app shows loading state while it starts)
      startBackendIfNeeded().catch(() => {});
      // Start Express server and wait until ready, then open window
      await startExpressServer();
      createWindow();
      initBackendMonitor();
    }

    // สร้างไอคอนถาดระบบเพื่อให้ผู้ใช้เปิดโปรแกรมเอง
    try {
      const trayIcon = path.join(__dirname, '..', 'assets', 'icons', 'taskbar.ico');
      tray = new Tray(nativeImage.createFromPath(trayIcon));
      tray.setToolTip('CNC Costify AI');
      const menu = Menu.buildFromTemplate([
        { label: 'Open App', click: () => createWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
      ]);
      tray.setContextMenu(menu);
      tray.on('click', () => createWindow());
    } catch (_) {}

    // ไม่เปิดหน้าต่างอัตโนมัติเมื่อแอปถูก activate (เช่น คลิก Dock/Taskbar)
    app.on('activate', function () {
      // intentionally no-op to avoid auto-opening
    });
  });
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Save to Excel
try {
  const ExcelJS = require('exceljs');
  ipcMain.handle('save-to-excel', async (event, { filePath, headers, row }) => {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const workbook = new ExcelJS.Workbook();
      if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
      }
      // Use only 'Data' sheet; create if missing
      let sheet = workbook.getWorksheet('Data');
      if (!sheet) {
        sheet = workbook.addWorksheet('Data');
      }

      // Add headers if first row empty
      if (sheet.rowCount === 0 || sheet.getRow(1).cellCount === 0) {
        sheet.addRow(headers);
      }
      sheet.addRow(row);

      await workbook.xlsx.writeFile(filePath);
      return { ok: true };
    } catch (err) {
      console.error('Failed to save to Excel:', err);
      return { ok: false, error: String(err) };
    }
  });
} catch (e) {
  console.error('exceljs not available:', e);
}

// IPC: Activation helpers
ipcMain.handle('compute-hardware-id', async () => {
  try {
    const id = licenseManager.computeHardwareId();
    return { ok: !!id, hardware_id: id || null };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('validate-license', async () => {
  try {
    const res = licenseManager.validateLicense();
    return res;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('get-license-path', async () => {
  try {
    const p = licenseManager.getLoadedLicensePath();
    return { ok: true, path: p };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('import-license', async (event, { license, target }) => {
  try {
    if (!license || typeof license !== 'object') {
      return { ok: false, error: 'Invalid license JSON' };
    }
    const targets = licenseManager.readLicensePaths();
    let dest = null;
    if (target === 'programData') dest = targets[0];
    else if (target === 'userData') dest = targets[1];
    else if (target === 'cwd') dest = targets[2];
    else dest = targets[1];

    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(license, null, 2), 'utf8');
    return { ok: true, path: dest };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle('launch-main-window', async () => {
  try {
    // Accept EITHER offline license.dat OR web-session (Phase B)
    let authOk = false;
    let authMethod = null;
    let authError = null;

    const res = licenseManager.validateLicense();
    if (res && res.ok) { authOk = true; authMethod = 'license.dat'; }
    else { authError = res && res.error ? res.error : 'unknown'; }

    if (!authOk) {
      try {
        const session = webSession.loadSession();
        if (session && session.token) {
          const localHw = (() => { try { return licenseManager.computeHardwareId(); } catch { return null; } })();
          const hwOk = !session.hardware_id || (localHw && session.hardware_id.toLowerCase() === String(localHw).toLowerCase());
          if (hwOk) { authOk = true; authMethod = 'web-session'; }
          else { authError = 'web_session_hw_mismatch'; }
        }
      } catch (_) {}
    }

    if (!authOk) {
      dialog.showErrorBox('สิทธิ์การใช้งานไม่ถูกต้อง', `โปรดนำเข้าไฟล์สิทธิ์การใช้งาน หรือเข้าสู่ระบบด้วยบัญชีเว็บไซต์ก่อนเปิดโปรแกรม\n\nเหตุผล: ${authError || 'unknown'}`);
      return { ok: false };
    }

    console.log('[main] Launch authorized via:', authMethod);
    startBackendIfNeeded().catch(() => {});
    await startExpressServer();
    if (activationWin) {
      activationWin.close();
    }
    createWindow();
    initBackendMonitor();
    return { ok: true, auth_method: authMethod };
  } catch (e) {
    dialog.showErrorBox('เปิดโปรแกรมล้มเหลว', String(e));
    return { ok: false, error: String(e) };
  }
});

// IPC: Open in Explorer
ipcMain.handle('open-in-explorer', async (event, { filePath }) => {
  try {
      if (filePath) {
      shell.showItemInFolder(filePath);
      return { ok: true };
    }
    return { ok: false, error: 'No filePath' };
  } catch (err) {
    console.error('Failed to open in explorer:', err);
    return { ok: false, error: String(err) };
  }
});

// IPC: Open file directly
ipcMain.handle('open-file', async (event, { filePath }) => {
  try {
    if (filePath) {
      const result = await shell.openPath(filePath);
      if (result) {
        // shell.openPath returns an error string on failure, empty string on success
        return { ok: false, error: result };
      }
      return { ok: true };
    }
    return { ok: false, error: 'No filePath' };
  } catch (err) {
    console.error('Failed to open file:', err);
    return { ok: false, error: String(err) };
  }
});

// IPC: Choose Excel Path
ipcMain.handle('choose-excel-path', async () => {
  const result = await dialog.showSaveDialog({
    title: 'เลือกไฟล์ Excel',
    defaultPath: path.join(app.getPath('documents'), 'Cost Data.xlsx'),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  return { canceled: result.canceled, filePath: result.filePath || null };
});

// PowerShell helper
function execPowerShell(cmd) {
  return new Promise((resolve, reject) => {
    try {
      const full = `powershell -NoProfile -ExecutionPolicy Bypass -Command ${cmd}`;
      exec(full, { windowsHide: true, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve({ stdout, stderr });
      });
    } catch (e) { reject(e); }
  });
}

// IPC: List audio devices (AudioEndpoint/Media)
ipcMain.handle('list-audio-devices', async () => {
  try {
    const ps = '$ErrorActionPreference="SilentlyContinue"; Get-PnpDevice -Class "AudioEndpoint","Media" | Select-Object Class, FriendlyName, Status, InstanceId | ConvertTo-Json -Depth 3';
    const { stdout } = await execPowerShell(`& { ${ps} }`);
    let devices = [];
    try { devices = JSON.parse(stdout || '[]'); } catch { devices = []; }
    return { ok: true, devices: Array.isArray(devices) ? devices : [devices] };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

// IPC: Scan and update microphone drivers (requires admin)
ipcMain.handle('scan-and-update-mic-drivers', async () => {
  try {
    const logPath = path.join(app.getPath('userData'), 'driver_update.log');
    const script = `
      $ErrorActionPreference = "SilentlyContinue"
      $log = "${logPath.replace(/\\\\/g, '/')}"
      "Starting driver update at $(Get-Date)" | Out-File -FilePath $log -Append
      try { Install-PackageProvider -Name NuGet -Force -Scope CurrentUser | Out-Null } catch {}
      try { Install-Module -Name PSWindowsUpdate -Force -Scope CurrentUser -AllowClobber | Out-Null } catch {}
      Import-Module PSWindowsUpdate
      Get-WindowsUpdate -MicrosoftUpdate -Category Drivers | Out-File -FilePath $log -Append
      Install-WindowsUpdate -MicrosoftUpdate -Category Drivers -AcceptAll -AutoReboot:$false | Out-File -FilePath $log -Append
      "Completed driver update at $(Get-Date)" | Out-File -FilePath $log -Append
    `;
    const escaped = script.replace(/"/g, '`"');
    await execPowerShell(`Start-Process PowerShell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command "${escaped}"' -Verb RunAs`);
    return { ok: true, started: true, logPath };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

// IPC: Open mic privacy settings
ipcMain.handle('open-mic-privacy-settings', async () => {
  try { await shell.openExternal('ms-settings:privacy-microphone'); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
});

// IPC: Open sound settings
ipcMain.handle('open-sound-settings', async () => {
  try { await shell.openExternal('ms-settings:sound'); return { ok: true }; }
  catch (e) { return { ok: false, error: String(e) }; }
});

// IPC: Run audio recording troubleshooter
ipcMain.handle('run-audio-troubleshooter', async () => {
  try {
    const child = spawn('msdt.exe', ['-id', 'AudioRecordingDiagnostic'], { detached: true, stdio: 'ignore' });
    child.unref();
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('copy-to-clipboard', (event, text) => { clipboard.writeText(text); return true; });

// ─── Web Login (Phase B) ────────────────────────────────────────────────
// Optional alternative to license.dat. Existing offline license flow is unchanged.

// Track in-flight sign-in so we can cancel + avoid races.
let _webSignInState = null; // { code, abort: AbortController }

ipcMain.handle('web-auth:get-session', async () => {
  try {
    const s = webSession.loadSession();
    return { ok: true, session: s };
  } catch (e) { return { ok: false, error: String(e) }; }
});

// Start: returns { code, authorizeUrl, expiresIn, hardware_id } and begins polling.
// Renderer receives 'web-auth:status' events for progress.
ipcMain.handle('web-auth:sign-in-start', async (event, { locale } = {}) => {
  try {
    if (_webSignInState) {
      try { _webSignInState.abort.abort(); } catch {}
      _webSignInState = null;
    }
    const start = await webAuth.signInStart(locale || 'th');
    webAuth.openAuthorizeUrl(start.authorizeUrl);

    const ctrl = new AbortController();
    _webSignInState = { code: start.code, abort: ctrl };

    // Fire-and-forget polling; events go back to renderer.
    (async () => {
      const sender = event.sender;
      const send = (payload) => { try { sender.send('web-auth:status', payload); } catch {} };
      send({ status: 'pending', code: start.code });
      const result = await webAuth.signInPollLoop(start.code, { signal: ctrl.signal });
      if (result.status === 'authorized') {
        webSession.saveSession({
          token: result.token,
          user: result.user,
          hardware_id: start.hardware_id,
        });
        send({ status: 'authorized', user: result.user, hardware_id: start.hardware_id });
        // Best-effort: report local license.dat status so /account reflects reality.
        try {
          const lic = licenseManager.validateLicense();
          if (lic && lic.ok) {
            await webAuth.reportLocalLicense({
              status: lic.status,
              expires_at: lic.expires_at || lic.until || null,
              days_left: typeof lic.days_left === 'number' ? lic.days_left : null,
            });
          } else {
            // No valid license.dat — clear any prior reported status
            await webAuth.reportLocalLicense({ status: null });
          }
        } catch (_) {}
      } else {
        send({ status: result.status || 'error', error: result.error || null });
      }
      if (_webSignInState && _webSignInState.code === start.code) _webSignInState = null;
    })().catch((e) => {
      console.error('[web-auth] poll loop crashed:', e);
    });

    return { ok: true, code: start.code, authorize_url: start.authorizeUrl, expires_in: start.expiresIn, hardware_id: start.hardware_id };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
});

ipcMain.handle('web-auth:sign-in-cancel', async () => {
  try {
    if (_webSignInState) {
      try { _webSignInState.abort.abort(); } catch {}
      _webSignInState = null;
    }
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});

ipcMain.handle('web-auth:sign-out', async () => {
  try { return { ok: webAuth.signOut() }; } catch (e) { return { ok: false, error: String(e) }; }
});

// Refresh user info / plan / quota from server.
ipcMain.handle('web-auth:me', async () => {
  try { return await webAuth.me(); } catch (e) { return { ok: false, error: String(e) }; }
});

// Pre-flight quota check (UI: "you can process N more files today").
ipcMain.handle('web-auth:quota-check', async (event, { requested = 1 } = {}) => {
  try { return await webAuth.quotaCheck(requested); } catch (e) { return { ok: false, error: String(e) }; }
});

// Post-success usage log (call once per file successfully processed).
ipcMain.handle('web-auth:quota-log', async (event, payload = {}) => {
  try { return await webAuth.quotaLog(payload); } catch (e) { return { ok: false, error: String(e) }; }
});

// V5.9: AI Proxy — Monthly+ plan users route analysis/chat through company keys.
ipcMain.handle('web-auth:ai-proxy-analyze', async (event, payload = {}) => {
  try { return await webAuth.aiProxyAnalyze(payload); } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('web-auth:ai-proxy-chat', async (event, payload = {}) => {
  try { return await webAuth.aiProxyChat(payload); } catch (e) { return { ok: false, error: String(e) }; }
});

// Open URL in user's default browser (used for /upgrade etc.)
ipcMain.handle('web-auth:open-url', async (event, { url } = {}) => {
  try {
    if (!url || typeof url !== 'string') return { ok: false, error: 'missing_url' };
    // Allow only https://(www.)cnccostify.cloud/* or api.cnccostify.cloud/* or cnc-costify://
    const allow = /^(https:\/\/(www\.|api\.)?cnccostify\.cloud\/|cnc-costify:\/\/)/i;
    if (!allow.test(url)) return { ok: false, error: 'url_not_allowed' };
    await shell.openExternal(url);
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
});
