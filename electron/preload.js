const { contextBridge, ipcRenderer, webFrame } = require('electron');

// Global UI zoom — uses Chromium's native page zoom (same as Ctrl+/Ctrl-).
// Scales fonts, spacing, paddings, images, EVERYTHING proportionally.
contextBridge.exposeInMainWorld('cncZoom', {
  set: (factor) => {
    try {
      const f = Math.max(0.5, Math.min(2.0, Number(factor) || 1));
      webFrame.setZoomFactor(f);
      return f;
    } catch (e) { return 1; }
  },
  get: () => {
    try { return webFrame.getZoomFactor(); } catch { return 1; }
  }
});

contextBridge.exposeInMainWorld('api', {
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  saveToExcel: (payload) => ipcRenderer.invoke('save-to-excel', payload),
  openInExplorer: (payload) => ipcRenderer.invoke('open-in-explorer', payload),
  openFile: (payload) => ipcRenderer.invoke('open-file', payload),
  chooseExcelPath: () => ipcRenderer.invoke('choose-excel-path'),
  // Activation helpers
  computeHardwareId: () => ipcRenderer.invoke('compute-hardware-id'),
  validateLicense: () => ipcRenderer.invoke('validate-license'),
  importLicense: (license, target) => ipcRenderer.invoke('import-license', { license, target }),
  launchMainWindow: () => ipcRenderer.invoke('launch-main-window'),
  getLicensePath: () => ipcRenderer.invoke('get-license-path'),
  // Microphone diagnostics disabled
  listAudioDevices: () => Promise.resolve({ ok: false, error: 'microphone disabled' }),
  scanAndUpdateMicDrivers: () => Promise.resolve({ ok: false, error: 'microphone disabled' }),
  openMicPrivacySettings: () => Promise.resolve({ ok: false, error: 'microphone disabled' }),
  openSoundSettings: () => Promise.resolve({ ok: false, error: 'microphone disabled' }),
  runAudioTroubleshooter: () => Promise.resolve({ ok: false, error: 'microphone disabled' }),
  // Backend state events
  onBackendState: (cb) => {
    if (typeof cb !== 'function') return () => {};
    const handler = (_evt, payload) => { try { cb(payload); } catch {} };
    ipcRenderer.on('backend-state', handler);
    return () => { ipcRenderer.removeListener('backend-state', handler); };
  }
});

// ─── Web Login (Phase B) ─────────────────────────────────────────────────
// Optional alternative to license.dat. Renderer (activation.html, main HTML)
// can use this to sign in via the website.
contextBridge.exposeInMainWorld('webAuth', {
  getSession: () => ipcRenderer.invoke('web-auth:get-session'),
  signInStart: (locale) => ipcRenderer.invoke('web-auth:sign-in-start', { locale }),
  signInCancel: () => ipcRenderer.invoke('web-auth:sign-in-cancel'),
  signOut: () => ipcRenderer.invoke('web-auth:sign-out'),
  me: () => ipcRenderer.invoke('web-auth:me'),
  quotaCheck: (requested) => ipcRenderer.invoke('web-auth:quota-check', { requested }),
  quotaLog: (payload) => ipcRenderer.invoke('web-auth:quota-log', payload),
  // V5.9: AI Proxy (plan-based shared AI for Monthly+)
  aiProxyAnalyze: (payload) => ipcRenderer.invoke('web-auth:ai-proxy-analyze', payload),
  aiProxyChat: (payload) => ipcRenderer.invoke('web-auth:ai-proxy-chat', payload),
  openUrl: (url) => ipcRenderer.invoke('web-auth:open-url', { url }),
  // Sign-in progress events
  onStatus: (cb) => {
    if (typeof cb !== 'function') return () => {};
    const handler = (_evt, payload) => { try { cb(payload); } catch {} };
    ipcRenderer.on('web-auth:status', handler);
    return () => { ipcRenderer.removeListener('web-auth:status', handler); };
  },
});

window.addEventListener('DOMContentLoaded', () => {
  // Keep for future DOM-ready hooks
});