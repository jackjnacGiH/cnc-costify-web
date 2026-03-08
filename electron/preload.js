const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
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

window.addEventListener('DOMContentLoaded', () => {
  // Keep for future DOM-ready hooks
});