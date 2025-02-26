const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow () {
    const win = new BrowserWindow({
        width: 768,
        height: 560,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Handle creating a new test file
    ipcMain.handle('create-file', (req, data) => {
      if (!data || !data.title || !data.content) return false;
      
      const filePath = path.join(__dirname, 'tests', `${data.title}.txt`);
      fs.writeFileSync(filePath, data.content);

      return {success: true, filePath};
    });

    // Handle getting list of test files
    ipcMain.handle('get-test-files', async () => {
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

    win.loadFile('src/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});