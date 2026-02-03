const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectReader: (config) => ipcRenderer.invoke('reader:connect', config),
  disconnectReader: () => ipcRenderer.invoke('reader:disconnect'),
  startScan: () => ipcRenderer.send('reader:start-scan'),
  stopScan: () => ipcRenderer.send('reader:stop-scan'),
  onTagRead: (callback) => ipcRenderer.on('rfid:tag-read', (_event, value) => callback(value)),
  removeTagListener: () => ipcRenderer.removeAllListeners('rfid:tag-read'),
});