const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Helper function to create URL-friendly slugs from student names
function getSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Set up all IPC handlers before the app is ready
function setupIpcHandlers() {
    // Handle creating a new test file
    ipcMain.handle('create-file', (event, data) => {
      if (!data || !data.title || !data.content) return false;
      
      const filePath = path.join(__dirname, 'tests', `${data.title}.txt`);
      fs.writeFileSync(filePath, data.content);

      return {success: true, filePath};
    });

    // Handle getting list of test files
    ipcMain.handle('get-test-files', async (event) => {
        const testsDir = path.join(__dirname, 'tests');
        
        // Make sure the directory exists
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }
        
        // Read the directory
        const files = fs.readdirSync(testsDir);
        
        // Filter for .txt files
        return files.filter(file => file.endsWith('.txt'));
    });

    // Handle getting content of a specific test file
    ipcMain.handle('get-test-content', async (event, filename) => {
        const filePath = path.join(__dirname, 'tests', filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File ${filename} does not exist`);
        }
        
        // Read the file
        return fs.readFileSync(filePath, 'utf8');
    });
    
    // Student Profile Handlers
    
    // Handle creating a new student profile
    ipcMain.handle('create-student-profile', async (event, profile) => {
        try {
            // Create students directory if it doesn't exist
            const studentsDir = path.join(__dirname, 'students');
            if (!fs.existsSync(studentsDir)) {
                fs.mkdirSync(studentsDir, { recursive: true });
            }
            
            // Create directory for this student
            const studentDir = path.join(studentsDir, getSlug(profile.name));
            if (!fs.existsSync(studentDir)) {
                fs.mkdirSync(studentDir, { recursive: true });
            }
            
            // Create tests directory for this student
            const testsDir = path.join(studentDir, 'tests');
            if (!fs.existsSync(testsDir)) {
                fs.mkdirSync(testsDir, { recursive: true });
            }
            
            // Save profile info
            const profilePath = path.join(studentDir, 'profile.json');
            fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
            
            return { 
                success: true, 
                message: 'Profile created successfully',
                profileId: getSlug(profile.name)
            };
        } catch (error) {
            console.error('Error creating student profile:', error);
            return { 
                success: false, 
                message: error.message
            };
        }
    });
    
    // Handle getting list of student profiles
    ipcMain.handle('get-student-profiles', async (event) => {
        try {
            const studentsDir = path.join(__dirname, 'students');
            
            // Make sure the directory exists
            if (!fs.existsSync(studentsDir)) {
                fs.mkdirSync(studentsDir, { recursive: true });
                return [];
            }
            
            // Read the directory
            const studentDirs = fs.readdirSync(studentsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
                
            // Read profile info for each student
            const profiles = [];
            for (const dir of studentDirs) {
                const profilePath = path.join(studentsDir, dir, 'profile.json');
                if (fs.existsSync(profilePath)) {
                    try {
                        const profileData = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
                        profiles.push({
                            filename: dir,
                            name: profileData.name,
                            gradeLevel: profileData.gradeLevel
                        });
                    } catch (err) {
                        console.error(`Error reading profile for ${dir}:`, err);
                    }
                }
            }
            
            return profiles;
        } catch (error) {
            console.error('Error getting student profiles:', error);
            return [];
        }
    });
    
    // Handle getting a specific student profile
    ipcMain.handle('get-student-profile', async (event, profileId) => {
        try {
            const profilePath = path.join(__dirname, 'students', profileId, 'profile.json');
            
            // Check if file exists
            if (!fs.existsSync(profilePath)) {
                throw new Error(`Profile ${profileId} does not exist`);
            }
            
            // Read the profile
            return JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        } catch (error) {
            console.error('Error getting student profile:', error);
            throw error;
        }
    });
    
    // Handle saving a test for a student
    ipcMain.handle('save-student-test', async (event, data) => {
        try {
            const { studentId, testData } = data;
            
            // Check if student exists
            const studentDir = path.join(__dirname, 'students', studentId);
            if (!fs.existsSync(studentDir)) {
                throw new Error(`Student profile ${studentId} does not exist`);
            }
            
            // Make sure tests directory exists
            const testsDir = path.join(studentDir, 'tests');
            if (!fs.existsSync(testsDir)) {
                fs.mkdirSync(testsDir, { recursive: true });
            }
            
            // Save test data
            const testPath = path.join(testsDir, `${testData.title}.txt`);
            fs.writeFileSync(testPath, testData.content);
            
            // Update the student's profile with the test reference
            const profilePath = path.join(studentDir, 'profile.json');
            const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
            
            if (!profile.tests) {
                profile.tests = [];
            }
            
            profile.tests.push({
                name: testData.title,
                date: new Date().toISOString(),
                path: `tests/${testData.title}.txt`
            });
            
            // Save updated profile
            fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
            
            return { 
                success: true, 
                message: 'Test saved successfully' 
            };
        } catch (error) {
            console.error('Error saving student test:', error);
            return { 
                success: false, 
                message: error.message 
            };
        }
    });
}

function createWindow () {
    const win = new BrowserWindow({
        width: 768,
        height: 560,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('src/index.html');
    
    // Open DevTools for debugging
    win.webContents.openDevTools();
}

// Set up IPC handlers before app is ready
setupIpcHandlers();

// Wait for app to be ready, then create window
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});