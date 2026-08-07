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
import type { Note } from '../types/item';

const COLLECTION = 'notes';

function mapNote(id: string, data: Record<string, unknown>): Note {
  return {
    id,
    title: String(data.title || ''),
    content: String(data.content || ''),
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

export const notesService = {
  async getAll(): Promise<Note[]> {
    try {
      const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => mapNote(d.id, d.data()));
    } catch {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs
        .map((d) => mapNote(d.id, d.data()))
        .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    }
  },

  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTION));
    const now = Timestamp.now();
    const payload: Record<string, unknown> = {
      title: note.title,
      content: note.content,
      archived: note.archived ?? false,
      createdAt: now,
      updatedAt: now,
    };
    if (note.projectId) payload.projectId = note.projectId;
    await setDoc(docRef, payload);
    return docRef.id;
  },

  async update(id: string, updates: Partial<Note>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    const clean: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (updates.title !== undefined) clean.title = updates.title;
    if (updates.content !== undefined) clean.content = updates.content;
    if (updates.projectId !== undefined) clean.projectId = updates.projectId;
    if (updates.archived !== undefined) clean.archived = updates.archived;
    await updateDoc(docRef, clean as never);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  subscribe(callback: (notes: Note[]) => void): Unsubscribe {
    try {
      const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          callback(snapshot.docs.map((d) => mapNote(d.id, d.data())));
        },
        () => {
          return onSnapshot(collection(db, COLLECTION), (snapshot) => {
            callback(
              snapshot.docs
                .map((d) => mapNote(d.id, d.data()))
                .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
            );
          });
        }
      );
    } catch {
      return onSnapshot(collection(db, COLLECTION), (snapshot) => {
        callback(
          snapshot.docs
            .map((d) => mapNote(d.id, d.data()))
            .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
        );
      });
    }
  },
};
