const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the React app
contextBridge.exposeInMainWorld('electronAPI', {
  // We can add IPC methods here later, e.g. for native dialogs or file access
  // selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory')
  saveBackup: (data) => ipcRenderer.invoke('save-backup', data)
});
