const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('api', {
    title: "My Test Calculator",
    createNote: (data) => ipcRenderer.invoke('create-file', data)
})