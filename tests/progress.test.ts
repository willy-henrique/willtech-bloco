import { describe, expect, it } from 'vitest';
import { goalProgress, habitCompletionRate, projectProgress } from '../src/lib/progress';
import type { Task } from '../src/types';

const baseTask = {
  userId: 'u1',
  description: '',
  priority: 'medium' as const,
  date: null,
  time: null,
  dueDate: null,
  projectId: 'p1',
  category: '',
  tags: [],
  subtasks: [],
  checklist: [],
  notes: '',
  reminderAt: null,
  recurrence: null,
  attachments: [],
  completedAt: null,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
};

describe('progress helpers', () => {
  it('calculates project progress from completed tasks', () => {
    const tasks = [
      { ...baseTask, id: '1', title: 'A', status: 'done' as const },
      { ...baseTask, id: '2', title: 'B', status: 'todo' as const },
      { ...baseTask, id: '3', title: 'C', status: 'todo' as const },
    ] satisfies Task[];
    expect(projectProgress(tasks)).toBe(33);
  });

  it('ignores archived tasks', () => {
    const tasks = [
      { ...baseTask, id: '1', title: 'A', status: 'done' as const },
      { ...baseTask, id: '2', title: 'B', status: 'archived' as const },
    ] satisfies Task[];
    expect(projectProgress(tasks)).toBe(100);
  });

  it('calculates habit and goal rates', () => {
    expect(habitCompletionRate(15, 30)).toBe(50);
    expect(goalProgress(25, 100)).toBe(25);
    expect(goalProgress(120, 100)).toBe(100);
  });
});
