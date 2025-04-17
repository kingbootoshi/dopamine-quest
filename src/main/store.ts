import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import logger from './logger';

export interface Task {
  id: string;
  title: string;
  category: string;
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
    const tasks: Task[] = JSON.parse(raw);
    logger.debug(`Loaded ${tasks.length} tasks`);
    return tasks;
  } catch (err) {
    logger.error('Failed to parse tasks.json', err as Error);
    return [];
  }
}

export async function saveTask(task: Task): Promise<Task> {
  await ensureFile();
  const tasks = await loadTasks();
  tasks.push(task);
  await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  logger.info(`Saved task "${task.title}" (+${task.xp} XP)`);
  return task;
}