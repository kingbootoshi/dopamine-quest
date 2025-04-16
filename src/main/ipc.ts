import { ipcMain } from 'electron';
import { loadTasks, saveTask } from './store';
import logger from './logger';

export function registerIpc() {
  ipcMain.handle('tasks:get', async () => {
    logger.debug('IPC get tasks');
    return loadTasks();
  });

  ipcMain.handle('tasks:add', async (_e, task) => {
    logger.debug('IPC add task');
    return saveTask(task);
  });
}