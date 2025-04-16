import { BrowserWindow } from 'electron';
import path from 'node:path';
import logger from './logger';

let mainWindow: BrowserWindow | null = null;
let quickWindow: BrowserWindow | null = null;

export function createMainWindow(devURL?: string, prodBase?: string) {
  logger.debug('Creating main window');
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  if (devURL) mainWindow.loadURL(devURL);
  else mainWindow.loadFile(path.join(prodBase!, 'index.html'));
}

export function createQuickWindow(devURL?: string, prodBase?: string) {
  if (quickWindow) {
    quickWindow.show();
    quickWindow.focus();
    return;
  }
  logger.debug('Creating quick‑add window');
  quickWindow = new BrowserWindow({
    width: 420,
    height: 280,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  const url = devURL ? `${devURL}?quick=1` : `file://${path.join(prodBase!, 'index.html?quick=1')}`;
  quickWindow.loadURL(url);
  quickWindow.on('blur', () => quickWindow?.hide());
  quickWindow.on('closed', () => (quickWindow = null));
}