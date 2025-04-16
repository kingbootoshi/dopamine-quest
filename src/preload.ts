import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  addTask: (task) => ipcRenderer.invoke('tasks:add', task),
  getTasks: () => ipcRenderer.invoke('tasks:get'),
});