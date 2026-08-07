import type { Task } from '../types';

export function projectProgress(tasks: Task[]): number {
  const relevant = tasks.filter((task) => task.status !== 'archived' && !task.deletedAt);
  if (relevant.length === 0) return 0;
  const done = relevant.filter((task) => task.status === 'done').length;
  return Math.round((done / relevant.length) * 100);
}

export function habitCompletionRate(completedDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
}

export function goalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
