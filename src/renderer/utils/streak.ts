import type { Task } from '../../main/store';

export function calcStreak(tasks: Task[]): number {
  const daySet = new Set<string>();
  tasks.forEach((t) => daySet.add(new Date(t.createdAt).toDateString()));

  let streak = 0;
  const oneDay = 86400000;
  const today = new Date();

  for (let offset = 0; ; offset++) {
    const d = new Date(today.getTime() - offset * oneDay).toDateString();
    if (daySet.has(d)) streak++;
    else break;
  }
  return streak;
}