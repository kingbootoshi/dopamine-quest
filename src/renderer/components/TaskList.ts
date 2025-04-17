import type { Task } from '../../main/store';

export function TaskList(tasks: Task[]): string {
  return tasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((t) => `<li class="task"><span>${t.title}</span><span>+${t.xp} XP</span></li>`)
    .join('');
}