import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  addTask: (task) => ipcRenderer.invoke('tasks:add', task),
  getTasks: () => ipcRenderer.invoke('tasks:get'),
  openQuick: () => ipcRenderer.invoke('quick:create'),
  log: (level: string, msg: string) => ipcRenderer.send('log:renderer', level, msg),
});