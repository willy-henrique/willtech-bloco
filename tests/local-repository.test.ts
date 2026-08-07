import { beforeEach, describe, expect, it } from 'vitest';
import { LocalRepository } from '../src/repositories/localRepository';

describe('LocalRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and lists entities scoped by user', () => {
    const repo = new LocalRepository<{ title: string }>('user-a', 'tasks');
    const created = repo.create({ title: 'Revisar Will Tech' });
    expect(created.id).toBeTruthy();
    expect(created.userId).toBe('user-a');
    expect(repo.list()).toHaveLength(1);
    expect(repo.list()[0].title).toBe('Revisar Will Tech');
  });

  it('soft deletes without removing raw record', () => {
    const repo = new LocalRepository<{ title: string }>('user-a', 'tasks');
    const created = repo.create({ title: 'Temp' });
    expect(repo.softDelete(created.id)).toBe(true);
    expect(repo.list()).toHaveLength(0);
    expect(repo.list(true)).toHaveLength(1);
  });
});
