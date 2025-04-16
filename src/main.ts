import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { loadTasks, saveTask } from './store';

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let quickWindow: BrowserWindow | null = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

const createQuickWindow = () => {
  if (quickWindow) {
    quickWindow.show();
    quickWindow.focus();
    return;
  }

  quickWindow = new BrowserWindow({
    width: 420,
    height: 280,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}?quick=1`
    : `file://${path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html?quick=1`
      )}`;

  quickWindow.loadURL(url);
  quickWindow.on('blur', () => quickWindow?.hide());
  quickWindow.on('closed', () => {
    quickWindow = null;
  });
};

app.whenReady().then(() => {
  createMainWindow();

  globalShortcut.register('Alt+Command+K', createQuickWindow);

  ipcMain.handle('tasks:get', async () => loadTasks());
  ipcMain.handle('tasks:add', async (_e, task) => saveTask(task));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});