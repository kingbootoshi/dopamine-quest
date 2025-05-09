import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getLogger } from '../../core/logger';
import type { Task } from '../../shared/types/domain';

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
    getLogger('taskStore').debug(`Loaded ${tasks.length} tasks`);
    return tasks;
  } catch (err) {
    getLogger('taskStore').error('Failed to parse tasks.json', err as Error);
    return [];
  }
}

export async function saveTask(task: Task): Promise<Task> {
  await ensureFile();
  const tasks = await loadTasks();
  tasks.push(task);
  await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  getLogger('taskStore').info(`Saved task "${task.title}" (+${task.xp} XP)`);
  return task;
}