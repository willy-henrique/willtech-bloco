import { Item, ItemType } from '../types/item';

export interface SearchFilters {
  query: string;
  type?: ItemType | 'all';
  projectId?: string | null;
  /** YYYY-MM-DD or empty */
  date?: string | null;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function searchItems(items: Item[], filters: SearchFilters): Item[] {
  const q = normalize(filters.query.trim());
  const type = filters.type && filters.type !== 'all' ? filters.type : null;

  return items.filter((item) => {
    if (item.status === 'archived') return false;
    if (type && item.type !== type) return false;
    if (filters.projectId && item.projectId !== filters.projectId) return false;
    if (filters.date) {
      const ts = item.dueAt || item.scheduledAt || item.reminderAt;
      if (!ts) return false;
      const day = new Date(ts).toISOString().slice(0, 10);
      if (day !== filters.date) return false;
    }
    if (!q) return true;
    const hay = normalize(`${item.title} ${item.content || ''}`);
    return hay.includes(q);
  });
}
