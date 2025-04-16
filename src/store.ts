import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface Task {
  id: string;
  title: string;
  impact: number;
  complexity: number;
  xp: number;
  createdAt: string;
}

const filePath = path.join(app.getPath('userData'), 'tasks.json');

async function ensureFile() {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf-8');
  }
}

export async function loadTasks(): Promise<Task[]> {
  await ensureFile();
  const raw = await fs.readFile(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveTask(task: Task): Promise<Task> {
  await ensureFile();
  const tasks = await loadTasks();
  tasks.push(task);
  await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  return task;
}