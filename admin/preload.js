const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('adminApi', {
  selectPrivateKey: () => ipcRenderer.invoke('select-private-key'),
  generateLicense: (payload, privateKeyPem, pubkeyId) => ipcRenderer.invoke('generate-license', { payload, privateKeyPem, pubkeyId }),
  saveLicense: (content, defaultPath) => ipcRenderer.invoke('save-license', { content, defaultPath }),
});