import { app, BrowserWindow, ipcMain, globalShortcut, Notification, dialog, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let isAlwaysOnTop = false;
let isCompact = false;

const DEFAULT_WIDTH = 1220;
const DEFAULT_HEIGHT = 820;
const COMPACT_WIDTH = 380;
const COMPACT_HEIGHT = 540;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: 360,
    minHeight: 480,
    frame: false,
    transparent: false,
    backgroundColor: '#07090e',
    title: 'VOIDLING: Rogue Digital Organism',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Check if localhost:5173 is running, otherwise load dist
    const url = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(url).catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'));
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register Global Boss Key shortcut (Ctrl+Shift+B)
  try {
    globalShortcut.register('CommandOrControl+Shift+B', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('trigger-boss-key');
      }
    });
  } catch (err) {
    console.warn('Failed to register global shortcut:', err);
  }
}

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-always-on-top', (_event, flag: boolean) => {
  isAlwaysOnTop = flag;
  mainWindow?.setAlwaysOnTop(flag, 'screen-saver');
  return isAlwaysOnTop;
});

ipcMain.handle('window-set-compact', (_event, compact: boolean) => {
  isCompact = compact;
  if (!mainWindow) return;

  if (isCompact) {
    mainWindow.setResizable(true);
    mainWindow.setSize(COMPACT_WIDTH, COMPACT_HEIGHT, true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  } else {
    mainWindow.setSize(DEFAULT_WIDTH, DEFAULT_HEIGHT, true);
    mainWindow.center();
    mainWindow.setAlwaysOnTop(isAlwaysOnTop, 'screen-saver');
  }
});

// Notifications
ipcMain.on('send-notification', (_event, { title, body }: { title: string; body: string }) => {
  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      silent: false,
    }).show();
  }
});

// Export Save File
ipcMain.handle('export-save-file', async (_event, data: string) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Voidling Anomaly Data',
      defaultPath: `voidling-dna-backup-${Date.now()}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Cancelled' };
    }

    fs.writeFileSync(result.filePath, data, 'utf-8');
    return { success: true, path: result.filePath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Import Save File
ipcMain.handle('import-save-file', async () => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Voidling Anomaly Data',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' };
    }

    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, data: content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Clipboard
ipcMain.on('clipboard-copy', (_event, text: string) => {
  clipboard.writeText(text);
});

// App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
