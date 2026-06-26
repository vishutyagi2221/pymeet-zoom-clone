const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onSourcesReceived: (callback) => ipcRenderer.on('SET_SOURCES', (_event, sources) => callback(sources)),
  selectSource: (sourceId) => ipcRenderer.send('SOURCE_SELECTED', sourceId),
  cancelSelection: () => ipcRenderer.send('SOURCE_CANCELLED')
});
