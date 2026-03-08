const { app, BrowserWindow, nativeImage, ipcMain, shell, dialog, Tray, Menu, session } = require('electron');
const fs = require('fs');
const net = require('net');
const { spawn, exec } = require('child_process');
const path = require('path');
const licenseManager = require('./licenseManager');

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'app.ico');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: nativeImage.createFromPath(iconPath),
    title: 'CNC Costify AI 2026 V3.0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const devUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}/`;
  if (app.isPackaged) {
    // In packaged mode, main.js runs inside app.asar. Use __dirname to resolve
    // the HTML relative to the asar contents (electron/../CNC_Costify_AI_V6.html).
    const htmlPath = path.join(__dirname, '..', 'CNC_Costify_AI_V6.html');
    win.loadFile(htmlPath);
  } else {
    win.loadURL(devUrl);
  }
}

// Activation window (license import & hardware ID)
let activationWin = null;
let tray = null;
function createActivationWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icons', 'app.ico');
  activationWin = new BrowserWindow({
    width: 640,
    height: 520,
    resizable: false,
    alwaysOnTop: true,
    icon: nativeImage.createFromPath(iconPath),
    title: 'Activation – CNC Costify AI 2026',
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
        dialog.showErrorBox('เริ่มแบ็กเอนด์ไม่สำเร็จ', 'ไม่สามารถเริ่ม CNC Costify AI 2026 Backend ได้ โปรดตรวจสอบสิทธิ์การใช้งานไฟล์และโปรแกรมป้องกันไวรัส/Firewall');
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

    if (postInstall) {
      // Always show Activation first on newly installed/updated version
      dialog.showMessageBox({
        type: 'info',
        title: 'ติดตั้งเสร็จ — ต้องลงทะเบียนก่อนใช้งาน',
        message: 'โปรดลงทะเบียนหรือเปิดการใช้งานด้วยไฟล์ license.dat ก่อนเข้าใช้งานระบบ',
      }).catch(() => {});
      createActivationWindow();
    } else if (!licenseOk) {
      // Inform user explicitly to register/activate before use
      dialog.showMessageBox({
        type: 'info',
        title: 'ต้องลงทะเบียนก่อนใช้งาน',
        message: 'โปรดลงทะเบียนหรือเปิดการใช้งานด้วยไฟล์ license.dat ก่อนเข้าใช้งานระบบ',
      }).catch(() => {});
      // Do not start backend yet; allow activation first
      createActivationWindow();
    } else {
      startBackendIfNeeded().catch(() => {});
      createWindow();
      initBackendMonitor();
    }

    // สร้างไอคอนถาดระบบเพื่อให้ผู้ใช้เปิดโปรแกรมเอง
    try {
      const trayIcon = path.join(__dirname, '..', 'assets', 'icons', 'taskbar.ico');
      tray = new Tray(nativeImage.createFromPath(trayIcon));
      tray.setToolTip('CNC Costify AI 2026');
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
    const res = licenseManager.validateLicense();
    if (!res || !res.ok) {
      dialog.showErrorBox('สิทธิ์การใช้งานไม่ถูกต้อง', `โปรดนำเข้าไฟล์สิทธิ์การใช้งานที่ถูกต้องก่อนเปิดโปรแกรม\n\nเหตุผล: ${res && res.error ? res.error : 'unknown'}`);
      return { ok: false };
    }
    if (verifyBackendRuntime()) {
      startBackendIfNeeded().catch(() => {});
    }
    if (activationWin) {
      activationWin.close();
    }
    createWindow();
    initBackendMonitor();
    return { ok: true };
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