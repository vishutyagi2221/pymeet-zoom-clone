const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  stopSharing: () => ipcRenderer.send('STOP_SHARING')
});
