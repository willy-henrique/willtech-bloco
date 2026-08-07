import { createId } from '../lib/id';
import { readJSON, storageKey, writeJSON } from '../lib/storage';
import type { BaseEntity, CollectionName } from '../types';

type EntityOf<T> = T & BaseEntity;

export class LocalRepository<T extends object> {
  constructor(
    private readonly userId: string,
    private readonly collection: CollectionName,
  ) {}

  private key() {
    return storageKey(this.userId, this.collection);
  }

  list(includeDeleted = false): EntityOf<T>[] {
    const items = readJSON<EntityOf<T>[]>(this.key(), []);
    return includeDeleted ? items : items.filter((item) => !item.deletedAt);
  }

  get(id: string): EntityOf<T> | null {
    return this.list(true).find((item) => item.id === id && !item.deletedAt) ?? null;
  }

  create(data: T): EntityOf<T> {
    const now = Date.now();
    const entity: EntityOf<T> = {
      ...data,
      id: createId(this.collection.slice(0, 3)),
      userId: this.userId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as EntityOf<T>;
    const items = this.list(true);
    items.unshift(entity);
    writeJSON(this.key(), items);
    return entity;
  }

  update(id: string, updates: Partial<T>): EntityOf<T> | null {
    const items = this.list(true);
    const index = items.findIndex((item) => item.id === id && !item.deletedAt);
    if (index < 0) return null;
    const next = {
      ...items[index],
      ...updates,
      updatedAt: Date.now(),
    } as EntityOf<T>;
    items[index] = next;
    writeJSON(this.key(), items);
    return next;
  }

  softDelete(id: string): boolean {
    const items = this.list(true);
    const index = items.findIndex((item) => item.id === id && !item.deletedAt);
    if (index < 0) return false;
    items[index] = {
      ...items[index],
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    };
    writeJSON(this.key(), items);
    return true;
  }

  replaceAll(items: EntityOf<T>[]): void {
    writeJSON(this.key(), items);
  }

  clear(): void {
    writeJSON(this.key(), []);
  }
}
