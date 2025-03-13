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

// Helper function for recursive directory deletion
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursive call for directories
                deleteFolderRecursive(curPath);
            } else {
                // Delete file
                fs.unlinkSync(curPath);
            }
        });
        // Delete the now-empty directory
        fs.rmdirSync(folderPath);
    }
}

// Set up all IPC handlers before the app is ready
function setupIpcHandlers() {
    // Handle creating a new test file
    ipcMain.handle('create-file', (event, data) => {
      if (!data || !data.title || !data.content) return {success: false, message: 'Missing title or content'};
      
      const filePath = path.join(__dirname, 'tests', `${data.title}.txt`);
      console.log("Creating file at:", filePath);
      
      try {
        // Ensure the tests directory exists
        const testsDir = path.join(__dirname, 'tests');
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, data.content);
        return {success: true, filePath};
      } catch (error) {
        console.error("Error creating file:", error);
        return {success: false, message: error.message};
      }
    });

    // Handle getting list of test files
    ipcMain.handle('get-test-files', async (event) => {
        const testsDir = path.join(__dirname, 'tests');
        console.log("Getting test files from:", testsDir);
        
        // Make sure the directory exists
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }
        
        // Read the directory
        const files = fs.readdirSync(testsDir);
        
        // Filter for .txt files
        const txtFiles = files.filter(file => file.endsWith('.txt'));
        console.log("Found test files:", txtFiles);
        return txtFiles;
    });

    // Handle getting content of a specific test file
    ipcMain.handle('get-test-content', async (event, filename) => {
        const filePath = path.join(__dirname, 'tests', filename);
        console.log("Getting test content from:", filePath);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File ${filename} does not exist`);
        }
        
        // Read the file
        return fs.readFileSync(filePath, 'utf8');
    });
    
    // Handle getting content of a student's test file
    ipcMain.handle('get-student-test-content', async (event, data) => {
        const { studentId, testPath } = data;
        
        // Construct the full path to the student's test file
        // Example path: students/john-doe/tests/test1.txt
        const fullPath = path.join(__dirname, 'students', studentId, testPath);
        
        console.log("Reading student test from:", fullPath);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Student test file not found: ${fullPath}`);
        }
        
        // Read and return the file content
        return fs.readFileSync(fullPath, 'utf8');
    });
    
    // Student Profile Handlers
    
    // Handle creating a new student profile
    ipcMain.handle('create-student-profile', async (event, profile) => {
        try {
            console.log("Creating student profile for:", profile.name);
            
            // Validate student name
            if (!profile.name || profile.name.trim() === '') {
                return {
                    success: false,
                    message: 'Student name cannot be empty'
                };
            }
            
            // Create students directory if it doesn't exist
            const studentsDir = path.join(__dirname, 'students');
            if (!fs.existsSync(studentsDir)) {
                fs.mkdirSync(studentsDir, { recursive: true });
            }
            
            // Check for a duplicate name
            const slug = getSlug(profile.name);
            const studentDir = path.join(studentsDir, slug);
            
            // If directory exists, check if it's a duplicate profile
            if (fs.existsSync(studentDir)) {
                try {
                    // Try to read the existing profile
                    const existingProfilePath = path.join(studentDir, 'profile.json');
                    if (fs.existsSync(existingProfilePath)) {
                        const existingProfile = JSON.parse(fs.readFileSync(existingProfilePath, 'utf8'));
                        
                        // Compare names (case-insensitive)
                        if (existingProfile.name.toLowerCase() === profile.name.toLowerCase()) {
                            return {
                                success: false,
                                message: `A student with the name "${profile.name}" already exists. Please use a different name.`
                            };
                        }
                    }
                } catch (err) {
                    console.error("Error checking for duplicate profile:", err);
                    // Continue with creation if we can't read the existing profile
                }
            }
            
            // Create directory for this student
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
                profileId: slug
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
            console.log("Getting student profiles");
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
                
            console.log("Found student directories:", studentDirs);
                
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
            
            console.log("Returning profiles:", profiles);
            return profiles;
        } catch (error) {
            console.error('Error getting student profiles:', error);
            return [];
        }
    });
    
    // Handle getting a specific student profile
    ipcMain.handle('get-student-profile', async (event, profileId) => {
        try {
            console.log("Getting student profile:", profileId);
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
            console.log("Saving student test:", studentId, testData.title);
            
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
            
            // Save test data to the student's tests directory
            const testPath = path.join(testsDir, `${testData.title}.txt`);
            console.log("Saving student test to:", testPath);
            
            // Get the student's profile
            const profilePath = path.join(studentDir, 'profile.json');
            const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
            
            if (!profile.tests) {
                profile.tests = [];
            }
            
            // Remove any existing tests with this name (to prevent duplicates)
            profile.tests = profile.tests.filter(test => test.name !== testData.title);
            
            // Write the test file
            fs.writeFileSync(testPath, testData.content);
            
            // Add the test reference to the profile
            profile.tests.push({
                name: testData.title,
                date: new Date().toISOString(),
                path: `tests/${testData.title}.txt`
            });
            
            // Save updated profile
            fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
            
            return { 
                success: true, 
                message: 'Test saved successfully to student profile'
            };
        } catch (error) {
            console.error('Error saving student test:', error);
            return { 
                success: false, 
                message: error.message
            };
        }
    });

    // Handle deleting a test file
    ipcMain.handle('delete-test-file', async (event, filename) => {
        try {
            console.log("Deleting test file:", filename);
            const filePath = path.join(__dirname, 'tests', filename);
            
            // Check if file exists before trying to delete
            if (!fs.existsSync(filePath)) {
                return { success: false, message: `File ${filename} does not exist` };
            }
            
            // Delete the file
            fs.unlinkSync(filePath);
            
            // Return success
            return { success: true, message: `File ${filename} deleted successfully` };
        } catch (error) {
            console.error('Error deleting test file:', error);
            return { success: false, message: error.message };
        }
    });

    // Handle cleaning up student test references
    ipcMain.handle('cleanup-student-test-references', async (event, data) => {
        try {
            const { studentId } = data;
            console.log("Cleaning up test references for student:", studentId);
            
            // Get the student profile
            const profilePath = path.join(__dirname, 'students', studentId, 'profile.json');
            
            // Check if profile exists
            if (!fs.existsSync(profilePath)) {
                return { success: false, message: `Student profile ${studentId} does not exist` };
            }
            
            // Read the profile
            const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
            
            // Filter out the deleted test
            if (profile.tests) {
                const originalCount = profile.tests.length;
                
                profile.tests = profile.tests.filter(test => {
                    // For each test, check if the file still exists
                    const testPath = path.join(__dirname, 'students', studentId, test.path);
                    console.log("Checking if test exists:", testPath);
                    
                    // Keep only tests where the file exists
                    const exists = fs.existsSync(testPath);
                    if (!exists) {
                        console.log("Test file not found, removing reference:", test.name);
                    }
                    return exists;
                });
                
                // Save the updated profile
                fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
                
                const removedCount = originalCount - profile.tests.length;
                return { 
                    success: true, 
                    message: `Removed ${removedCount} invalid test references`
                };
            }
            
            return { success: true, message: 'No test references needed cleanup' };
        } catch (error) {
            console.error('Error cleaning up student test references:', error);
            return { success: false, message: error.message };
        }
    });

    // Handle deleting a student profile
    ipcMain.handle('delete-student-profile', async (event, profileId) => {
        try {
            console.log("Deleting student profile:", profileId);
            
            // Construct the path to the student's directory
            const studentDir = path.join(__dirname, 'students', profileId);
            
            // Check if directory exists
            if (!fs.existsSync(studentDir)) {
                return { success: false, message: `Student profile ${profileId} does not exist` };
            }
            
            // Use recursive deletion to remove the entire student directory
            // For Node.js 14.14.0 or newer, you can use fs.rmSync
            // fs.rmSync(studentDir, { recursive: true, force: true });
            
            // For older Node.js versions, use the helper function
            deleteFolderRecursive(studentDir);
            
            return { 
                success: true, 
                message: `Student profile ${profileId} deleted successfully`
            };
        } catch (error) {
            console.error('Error deleting student profile:', error);
            return { 
                success: false, 
                message: error.message
            };
        }
    });

    // Handle deleting a student's test
    ipcMain.handle('delete-student-test', async (event, data) => {
        try {
            const { studentId, testIndex, testName } = data;
            console.log("Deleting test for student:", studentId, testName);
            
            // Get the student profile
            const profilePath = path.join(__dirname, 'students', studentId, 'profile.json');
            
            // Check if profile exists
            if (!fs.existsSync(profilePath)) {
                return { success: false, message: `Student profile ${studentId} does not exist` };
            }
            
            // Read the profile
            const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
            
            // Find the test by index or name
            if (!profile.tests || profile.tests.length === 0) {
                return { success: false, message: "No tests found for this student" };
            }
            
            // Get the test to delete
            let testToDelete;
            if (typeof testIndex === 'number' && testIndex >= 0 && testIndex < profile.tests.length) {
                testToDelete = profile.tests[testIndex];
            } else {
                testToDelete = profile.tests.find(test => test.name === testName);
            }
            
            if (!testToDelete) {
                return { success: false, message: `Test ${testName} not found for this student` };
            }
            
            // Get the path to the test file
            const testPath = path.join(__dirname, 'students', studentId, testToDelete.path);
            
            // Delete the test file if it exists
            if (fs.existsSync(testPath)) {
                fs.unlinkSync(testPath);
            }
            
            // Remove the test from the profile
            profile.tests = profile.tests.filter(test => test.name !== testToDelete.name);
            
            // Save the updated profile
            fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
            
            return { 
                success: true, 
                message: `Test ${testToDelete.name} deleted successfully`
            };
        } catch (error) {
            console.error('Error deleting student test:', error);
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
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
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