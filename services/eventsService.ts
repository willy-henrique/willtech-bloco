import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../src/config/firebase';
import type { CalendarEvent } from '../types/item';

const COLLECTION = 'events';

function mapEvent(id: string, data: Record<string, unknown>): CalendarEvent {
  return {
    id,
    title: String(data.title || ''),
    content: data.content ? String(data.content) : undefined,
    kind: (data.kind as CalendarEvent['kind']) || 'event',
    scheduledAt:
      (data.scheduledAt as { toMillis?: () => number })?.toMillis?.() ||
      (data.scheduledAt as number) ||
      Date.now(),
    projectId: (data.projectId as string | null | undefined) ?? null,
    archived: Boolean(data.archived),
    createdAt:
      (data.createdAt as { toMillis?: () => number })?.toMillis?.() ||
      (data.createdAt as number) ||
      Date.now(),
    updatedAt:
      (data.updatedAt as { toMillis?: () => number })?.toMillis?.() ||
      (data.updatedAt as number | undefined),
  };
}

export const eventsService = {
  async getAll(): Promise<CalendarEvent[]> {
    try {
      const q = query(collection(db, COLLECTION), orderBy('scheduledAt', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => mapEvent(d.id, d.data()));
    } catch {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs
        .map((d) => mapEvent(d.id, d.data()))
        .sort((a, b) => a.scheduledAt - b.scheduledAt);
    }
  },

  async create(
    event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = doc(collection(db, COLLECTION));
    const now = Timestamp.now();
    const payload: Record<string, unknown> = {
      title: event.title,
      kind: event.kind,
      scheduledAt: Timestamp.fromMillis(event.scheduledAt),
      archived: event.archived ?? false,
      createdAt: now,
      updatedAt: now,
    };
    if (event.content) payload.content = event.content;
    if (event.projectId) payload.projectId = event.projectId;
    await setDoc(docRef, payload);
    return docRef.id;
  },

  async update(id: string, updates: Partial<CalendarEvent>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    const clean: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (updates.title !== undefined) clean.title = updates.title;
    if (updates.content !== undefined) clean.content = updates.content;
    if (updates.kind !== undefined) clean.kind = updates.kind;
    if (updates.scheduledAt !== undefined) {
      clean.scheduledAt = Timestamp.fromMillis(updates.scheduledAt);
    }
    if (updates.projectId !== undefined) clean.projectId = updates.projectId;
    if (updates.archived !== undefined) clean.archived = updates.archived;
    await updateDoc(docRef, clean as never);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  subscribe(callback: (events: CalendarEvent[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, COLLECTION), orderBy('scheduledAt', 'asc'));
      return onSnapshot(
        q,
        (snapshot) => {
          callback(snapshot.docs.map((d) => mapEvent(d.id, d.data())));
        },
        () => {
          return onSnapshot(collection(db, COLLECTION), (snapshot) => {
            callback(
              snapshot.docs
                .map((d) => mapEvent(d.id, d.data()))
                .sort((a, b) => a.scheduledAt - b.scheduledAt)
            );
          });
        }
      );
    } catch {
      return onSnapshot(collection(db, COLLECTION), (snapshot) => {
        callback(
          snapshot.docs
            .map((d) => mapEvent(d.id, d.data()))
            .sort((a, b) => a.scheduledAt - b.scheduledAt)
        );
      });
    }
  },
};
