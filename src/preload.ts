import { contextBridge, ipcRenderer } from 'electron';
import type { Task, Profile } from './shared/types/domain';

contextBridge.exposeInMainWorld('api', {
  addTask: (title: string) => ipcRenderer.invoke('tasks:add', { title }),
  getTasks: () => ipcRenderer.invoke('tasks:get'),
  getProfile: () => ipcRenderer.invoke('profile:get'),
  setProfile: (profile: Profile) => ipcRenderer.invoke('profile:set', profile),
  openQuick: () => ipcRenderer.invoke('quick:create'),
  onTaskAdded: (handler: (task: Task) => void) =>
    ipcRenderer.on('tasks:added', (_e, task) => handler(task)),
  log: (level: string, msg: string) => ipcRenderer.send('log:renderer', level, msg),
});