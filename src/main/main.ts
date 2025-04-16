import { app, globalShortcut } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow, createQuickWindow } from './windows';
import { registerIpc } from './ipc';
import logger from './logger';

if (started) {
  app.quit();
}

app.whenReady().then(() => {
  const devURL = process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL;
  const prodBase = `../renderer/${process.env.MAIN_WINDOW_VITE_NAME}`;

  createMainWindow(devURL, prodBase);
  registerIpc();

  globalShortcut.register('Alt+Command+K', () => createQuickWindow(devURL, prodBase));
  logger.info('QuestXP ready');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (global.BrowserWindow?.getAllWindows().length === 0) {
    const devURL = process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL;
    const prodBase = `../renderer/${process.env.MAIN_WINDOW_VITE_NAME}`;
    createMainWindow(devURL, prodBase);
  }
});