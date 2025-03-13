const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('api', {
    title: "Test Calculator App",
    
    // Test file operations
    createNote: (data) => ipcRenderer.invoke('create-file', data),
    getTestFiles: () => ipcRenderer.invoke('get-test-files'),
    getTestContent: (filename) => ipcRenderer.invoke('get-test-content', filename),
    deleteTestFile: (filename) => ipcRenderer.invoke('delete-test-file', filename),
    
    // Student profile operations
    createStudentProfile: (profile) => ipcRenderer.invoke('create-student-profile', profile),
    getStudentProfiles: () => ipcRenderer.invoke('get-student-profiles'),
    getStudentProfile: (filename) => ipcRenderer.invoke('get-student-profile', filename),
    deleteStudentProfile: (profileId) => ipcRenderer.invoke('delete-student-profile', profileId),
    
    // Student test operations
    saveStudentTest: (studentId, testData) => ipcRenderer.invoke('save-student-test', {studentId, testData}),
    getStudentTestContent: (studentId, testPath) => ipcRenderer.invoke('get-student-test-content', {studentId, testPath}),
    cleanupStudentTestReferences: (studentId) => ipcRenderer.invoke('cleanup-student-test-references', {studentId}),
    deleteStudentTest: (data) => ipcRenderer.invoke('delete-student-test', data)
});