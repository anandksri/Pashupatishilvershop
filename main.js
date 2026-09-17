/**
 * Electron Main Process for Shambhu Ji RXL Billing
 * Standalone Windows Desktop Billing Application
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const database = require('./database/database');
const printing = require('./printing/print');
const drive = require('./google-drive/drive');

let mainWindow = null;
let viteProcess = null;

function startViteServer() {
  if (viteProcess || process.env.ELECTRON_NO_VITE === 'true') {
    return;
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  viteProcess = spawn(command, ['vite', '--host', '127.0.0.1', '--port', '3000'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      BROWSER: 'none',
      NODE_ENV: 'development',
    },
  });

  viteProcess.on('exit', (code) => {
    if (code !== 0) {
      console.warn(`[Electron] Vite dev server exited with code ${code}`);
    }
    viteProcess = null;
  });
}

function waitForUrl(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const start = Date.now();
    const tryRequest = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(tryRequest, 250);
      });
    };

    tryRequest();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 720,
    title: 'Shambhu Ji RXL Billing',
    backgroundColor: '#f5f5f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'New Bill', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu:newBill') },
        { label: 'Save Bill (Temporarily Disabled)', enabled: false },
        { label: 'Print Bill', accelerator: 'CmdOrCtrl+P', click: () => mainWindow.webContents.send('menu:printBill') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Shambhu Ji RXL Billing',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Shambhu Ji RXL Billing',
              message: 'Shambhu Ji RXL Billing Software\nVersion 1.0.0\nWindows Desktop Billing Application',
              detail: 'Built for precision jeweler billing with arithmetic expressions, local persistence, and physical bill printing.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  const distPath = path.join(__dirname, 'dist', 'index.html');

  if (isDev) {
    startViteServer();
    waitForUrl('http://127.0.0.1:3000')
      .then(() => mainWindow.loadURL('http://127.0.0.1:3000'))
      .catch((err) => {
        console.error('[Electron] Failed to connect to Vite dev server:', err);
        mainWindow.loadURL('data:text/html,<html><body><h1>Unable to connect to the app server.</h1></body></html>');
      });
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    startViteServer();
    waitForUrl('http://127.0.0.1:3000')
      .then(() => mainWindow.loadURL('http://127.0.0.1:3000'))
      .catch((err) => {
        console.error('[Electron] Failed to connect to fallback Vite server:', err);
        mainWindow.loadURL('data:text/html,<html><body><h1>Unable to connect to the app server.</h1></body></html>');
      });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  database.init(userDataPath);

  registerIpcHandlers();
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

/**
 * Register safe IPC handlers for database, printing, and backup
 */
function registerIpcHandlers() {
  // 1. Database IPC
  ipcMain.handle('db:getBills', async () => {
    return database.getBills();
  });

  ipcMain.handle('db:getBillById', async (_, id) => {
    return database.getBillById(id);
  });

  ipcMain.handle('db:saveBill', async (_, payload) => {
    const bill = payload?.bill || payload;
    const imageDataUrl = payload?.imageDataUrl;
    const result = database.saveBill(bill);
    try {
      const driveResult = await drive.backupBill(bill, imageDataUrl);
      if (driveResult.success) {
        result.message += driveResult.updated
          ? ' Bill updated in Google Drive.'
          : ' Bill saved to Google Drive.';
      } else {
        result.message += ` Local bill saved, but Google Drive was not updated: ${driveResult.error}`;
      }
    } catch (error) {
      console.error('[Google Drive] Bill upload failed:', error);
      result.message += ` Local bill saved, but Google Drive upload failed: ${error.message}`;
    }
    return result;
  });

  ipcMain.handle('db:deleteBill', async (_, id) => {
    return database.deleteBill(id);
  });

  ipcMain.handle('db:getSettings', async () => {
    return database.getSettings();
  });

  ipcMain.handle('db:saveSettings', async (_, settings) => {
    return database.saveSettings(settings);
  });

  ipcMain.handle('db:getNextSerial', async () => {
    return database.getNextSerial();
  });

  // 2. Printing IPC
  ipcMain.handle('print:bill', async (_, options) => {
    return printing.printActiveBill(mainWindow, options);
  });

  ipcMain.handle('print:getPrinters', async () => {
    return printing.getPrinters(mainWindow);
  });

  ipcMain.handle('print:capture-bill-image', async (_, rect) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error('No active window available for bill image capture');
    }

    const image = await mainWindow.webContents.capturePage({
      x: Math.max(0, Math.round(rect.x)),
      y: Math.max(0, Math.round(rect.y)),
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height)),
    });
    return image.toDataURL();
  });

  // 3. Backup IPC
  ipcMain.handle('drive:getStatus', async () => {
    return drive.getStatus ? drive.getStatus() : { configured: false };
  });

  ipcMain.handle('drive:backup', async (_, data) => {
    return drive.backupDatabase ? drive.backupDatabase(data) : { success: false };
  });

  ipcMain.handle('backup:export', async () => {
    const bills = database.getBills();
    const settings = database.getSettings();
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Bills Backup',
      defaultPath: `shambhu_ji_backup_${Date.now()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify({ bills, settings }, null, 2), 'utf8');
      return { success: true, filePath };
    }
    return { success: false };
  });

  ipcMain.handle('backup:import', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Bills Backup',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (filePaths && filePaths.length > 0) {
      const raw = fs.readFileSync(filePaths[0], 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed.bills && Array.isArray(parsed.bills)) {
        parsed.bills.forEach((b) => database.saveBill(b));
        if (parsed.settings) database.saveSettings(parsed.settings);
        return { success: true, count: parsed.bills.length };
      }
    }
    return { success: false, count: 0 };
  });
}
