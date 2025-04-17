import { ipcMain, BrowserWindow } from 'electron';
import crypto from 'node:crypto';
import { getLogger } from '../logger';
import { createQuickWindow } from '../windows';
import { loadTasks, saveTask } from '../../features/persistence/taskStore';
import { loadProfile, saveProfile } from '../../features/persistence/profileStore';
import { chooseXp } from '../../features/ai';
import type { Task, Profile } from '../../shared/types/domain';

export function registerIpc() {
  // ---------- Task channels ----------
  ipcMain.handle('tasks:get', async () => {
    getLogger('ipc').debug('IPC get tasks');
    return loadTasks();
  });

  ipcMain.handle('tasks:add', async (_e, payload: { title: string }) => {
    getLogger('ipc').debug('IPC add task');

    const profile = await loadProfile();
    const { category, xp } = await chooseXp(payload.title, profile);

    const task: Task = {
      id: crypto.randomUUID(),
      title: payload.title,
      category,
      xp,
      createdAt: new Date().toISOString(),
    };

    await saveTask(task);

    // Notify every open window so the UI can update in real‑time
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('tasks:added', task);
    });

    return task;
  });

  // ---------- Profile channels ----------
  ipcMain.handle('profile:get', async () => loadProfile());
  ipcMain.handle('profile:set', async (_e, profile: Profile) => saveProfile(profile));

  // ---------- UI channels ----------
  ipcMain.handle('quick:create', async () => {
    getLogger('ipc').debug('IPC quick:create');
    createQuickWindow();
  });

  // ---------- Renderer‑side logging ----------
  ipcMain.on('log:renderer', (_e, level: string, message: string) => {
    getLogger('ipc').log({ level, message: `[renderer] ${message}` });
  });
}