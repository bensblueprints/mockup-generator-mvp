const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mockcraft', {
  openImage: () => ipcRenderer.invoke('open-image'),
  savePng: (name, base64) => ipcRenderer.invoke('save-png', name, base64),
  saveBatch: (files) => ipcRenderer.invoke('save-batch', files),
});
