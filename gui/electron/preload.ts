const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectReader: (config: any) => ipcRenderer.invoke('reader:connect', config),
  disconnectReader: () => ipcRenderer.invoke('reader:disconnect'),
  startScan: () => ipcRenderer.send('reader:start-scan'),
  stopScan: () => ipcRenderer.send('reader:stop-scan'),
  onTagRead: (callback: (value: any) => void) => ipcRenderer.on('rfid:tag-read', (_event: any, value: any) => callback(value)),
  removeTagListener: () => ipcRenderer.removeAllListeners('rfid:tag-read'),

  onOpenSettings: (callback: (value: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('menu:open-settings', subscription);
    return () => ipcRenderer.removeListener('menu:open-settings', subscription);
  },
  saveSettings: (settings: any) => ipcRenderer.invoke('reader:configure', settings),

  onExportLogsTrigger: (callback: (value: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('menu:export-logs', subscription);
    return () => ipcRenderer.removeListener('menu:export-logs', subscription);
  },
  saveLogs: (logContent: string) => ipcRenderer.invoke('logs:save-to-file', logContent),

  onExportDataTrigger: (callback: (value: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('menu:export-data', subscription);
    return () => ipcRenderer.removeListener('menu:export-data', subscription);
  },

  saveDataCSV: (data: string, days: number | string) => ipcRenderer.invoke('data:save-csv', { content: data, days }),
});
