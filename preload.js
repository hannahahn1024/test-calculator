const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('api', {
    title: "My Test Calculator",
    createNote: (data) => ipcRenderer.invoke('create-file', data),
    
    // Use IPC to get test files from main process
    getTestFiles: () => ipcRenderer.invoke('get-test-files'),
    
    // Use IPC to get test content from main process
    getTestContent: (filename) => ipcRenderer.invoke('get-test-content', filename)
});