import { ipcMain } from 'electron';
import { loadTasks, saveTask } from './store';
import logger from './logger';
import { createQuickWindow } from './windows';

export function registerIpc() {
  // ---------- Task channels ----------
  ipcMain.handle('tasks:get', async () => {
    logger.debug('IPC get tasks');
    return loadTasks();
  });

  ipcMain.handle('tasks:add', async (_e, task) => {
    logger.debug('IPC add task');
    return saveTask(task);
  });

  // ---------- UI channels ----------
  ipcMain.handle('quick:create', async () => {
    logger.debug('IPC quick:create');
    createQuickWindow();
  });

  // ---------- Renderer‑side logging ----------
  ipcMain.on('log:renderer', (_e, level: string, message: string) => {
    logger.log({ level, message: `[renderer] ${message}` });
  });
}