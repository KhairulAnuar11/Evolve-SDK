// gui/electron-main.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// Import your SDK (Assuming it's built or linked)
// const { UF3SReader } = require('../../sdk/dist/index'); 

let mainWindow;
// let readerInstance = new UF3SReader(); // Initialize your SDK class

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // You need a preload script
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load Vite dev server or build
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL('http://localhost:5173'); // Adjust for your Vite port
}

// --- IPC Handlers (React calls these) ---

ipcMain.handle('reader:connect', async (event, config) => {
  // return await readerInstance.connect(config);
  console.log("Connecting to reader...", config);
  return { success: true, message: "Connected" }; // Mock response
});

ipcMain.handle('reader:disconnect', async () => {
  // return await readerInstance.disconnect();
  return { success: true };
});

ipcMain.on('reader:start-scan', () => {
  // readerInstance.on('tag', (tag) => {
  //   mainWindow.webContents.send('rfid:tag-read', tag);
  // });
  // readerInstance.startReading();
});

app.whenReady().then(createWindow);