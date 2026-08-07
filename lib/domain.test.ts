import { describe, expect, it } from 'vitest';
import { TaskPriority } from '../types';
import {
  INBOX_PROJECT_ID,
  isInboxTask,
  parseCaptureIntent,
  taskToItem,
  buildItems,
} from './domain';

describe('domain', () => {
  it('detects inbox tasks', () => {
    expect(
      isInboxTask({
        id: '1',
        projectId: INBOX_PROJECT_ID,
        description: 'pesquisar DeepSeek',
        priority: TaskPriority.NORMAL,
        isCompleted: false,
        createdAt: Date.now(),
        inbox: true,
        status: 'inbox',
      })
    ).toBe(true);
  });

  it('parses hoje/amanhã hints', () => {
    expect(parseCaptureIntent('pagar internet hoje').dueHint).toBe('today');
    expect(parseCaptureIntent('falar com Matheus amanhã').dueHint).toBe('tomorrow');
  });

  it('maps task to unified item', () => {
    const item = taskToItem({
      id: 't1',
      projectId: 'inbox',
      description: 'comprar shampoo',
      priority: TaskPriority.NORMAL,
      isCompleted: false,
      createdAt: 1,
      inbox: true,
    });
    expect(item.type).toBe('task');
    expect(item.title).toBe('comprar shampoo');
    expect(item.status).toBe('inbox');
  });

  it('builds searchable items', () => {
    const items = buildItems({
      tasks: [
        {
          id: 't1',
          projectId: 'p1',
          description: 'tarefa',
          priority: TaskPriority.NORMAL,
          isCompleted: false,
          createdAt: 2,
          status: 'active',
        },
      ],
      notes: [{ id: 'n1', title: 'ideia', content: 'mavo', createdAt: 1 }],
      events: [
        {
          id: 'e1',
          title: 'reunião',
          kind: 'event',
          scheduledAt: 3,
          createdAt: 3,
        },
      ],
    });
    expect(items).toHaveLength(3);
  });
});
