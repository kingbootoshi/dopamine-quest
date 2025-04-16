import { BrowserWindow } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import logger from './logger';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;
let quickWindow: BrowserWindow | null = null;

function buildFileUrl(): string {
  const htmlPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
  return pathToFileURL(htmlPath).href;
}

export function createMainWindow() {
  logger.debug('Creating main window');
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadURL(buildFileUrl());
  }
}

export function createQuickWindow() {
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

  const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
    ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}?quick=1`
    : `${buildFileUrl()}?quick=1`;

  quickWindow.loadURL(url);
  quickWindow.on('blur', () => quickWindow?.hide());
  quickWindow.on('closed', () => (quickWindow = null));
}