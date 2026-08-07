import { describe, expect, it } from 'vitest';
import { searchItems } from './search';
import type { Item } from '../types/item';

const items: Item[] = [
  {
    id: '1',
    type: 'task',
    title: 'falar com Matheus',
    status: 'active',
    createdAt: 1,
  },
  {
    id: '2',
    type: 'note',
    title: 'Mavo Talk',
    content: 'integração OpenAI',
    status: 'active',
    createdAt: 2,
  },
  {
    id: '3',
    type: 'task',
    title: 'arquivado',
    status: 'archived',
    createdAt: 3,
  },
];

describe('searchItems', () => {
  it('filters by query in realtime style', () => {
    expect(searchItems(items, { query: 'matheus' })).toHaveLength(1);
    expect(searchItems(items, { query: 'openai' })[0].id).toBe('2');
  });

  it('filters by type and ignores archived', () => {
    expect(searchItems(items, { query: '', type: 'task' })).toHaveLength(1);
  });
});
