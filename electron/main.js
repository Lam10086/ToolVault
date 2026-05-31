import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000', // Transparent so our CSS shows through
      symbolColor: '#ffffff', // White window controls
      height: 36
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allow local files if needed, or bypass cors
    },
    // frameless or custom titlebar can be added later
  });

  if (isDev) {
    // Load Vite dev server
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools(); // Disabled by default for better desktop UX
  } else {
    // Load built index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // --- IPC Handlers ---
  ipcMain.handle('save-backup', async (event, { filename, content, extension, maxBackups }) => {
    try {
      const userDataPath = app.getPath('userData');
      const backupDir = path.join(userDataPath, 'Backups');
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Write the file
      const filePath = path.join(backupDir, filename);
      fs.writeFileSync(filePath, content, 'utf-8');

      // Apply FIFO: keep only up to maxBackups for this extension
      if (maxBackups && extension) {
        const files = fs.readdirSync(backupDir)
          .filter(f => f.endsWith(extension))
          .map(f => {
            const p = path.join(backupDir, f);
            return { name: f, path: p, time: fs.statSync(p).mtime.getTime() };
          })
          .sort((a, b) => a.time - b.time); // oldest first
        
        if (files.length > maxBackups) {
          const numToDelete = files.length - maxBackups;
          for (let i = 0; i < numToDelete; i++) {
            fs.unlinkSync(files[i].path);
            console.log(`[FIFO] Removed old backup: ${files[i].name}`);
          }
        }
      }

      return { success: true, path: filePath };
    } catch (err) {
      console.error('Failed to save backup via IPC:', err);
      return { success: false, error: err.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
