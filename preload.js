const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('api', {
    title: "Test Calculator App",
    createNote: (data) => ipcRenderer.invoke('create-file', data),
    
    // Use IPC to get test files from main process
    getTestFiles: () => ipcRenderer.invoke('get-test-files'),
    
    // Use IPC to get test content from main process
    getTestContent: (filename) => ipcRenderer.invoke('get-test-content', filename),
    
    // Student profile functions
    createStudentProfile: (profile) => ipcRenderer.invoke('create-student-profile', profile),
    getStudentProfiles: () => ipcRenderer.invoke('get-student-profiles'),
    getStudentProfile: (filename) => ipcRenderer.invoke('get-student-profile', filename),
    
    // Associate test with student
    saveStudentTest: (studentId, testData) => ipcRenderer.invoke('save-student-test', {studentId, testData})
});