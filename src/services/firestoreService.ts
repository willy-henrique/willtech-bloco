import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, Snippet, VaultItem } from '../../types';

// Coleções do Firestore
const COLLECTIONS = {
  TASKS: 'tasks',
  SNIPPETS: 'snippets',
  VAULT: 'vault'
} as const;

// ==================== TASKS ====================
export const tasksService = {
  // Buscar todas as tarefas
  async getAll(): Promise<Task[]> {
    const q = query(collection(db, COLLECTIONS.TASKS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
      } as Task;
    });
  },

  // Buscar tarefa por ID
  async getById(id: string): Promise<Task | null> {
    const docRef = doc(db, COLLECTIONS.TASKS, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
      } as Task;
    }
    return null;
  },

  // Criar nova tarefa
  async create(task: Omit<Task, 'id'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.TASKS));
    await setDoc(docRef, {
      ...task,
      createdAt: task.createdAt ? Timestamp.fromMillis(task.createdAt) : Timestamp.now()
    });
    return docRef.id;
  },

  // Atualizar tarefa
  async update(id: string, updates: Partial<Task>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TASKS, id);
    await updateDoc(docRef, updates as any);
  },

  // Deletar tarefa
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TASKS, id);
    await deleteDoc(docRef);
  },

  // Escutar mudanças em tempo real
  subscribe(callback: (tasks: Task[]) => void): Unsubscribe {
    const q = query(collection(db, COLLECTIONS.TASKS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt
      } as Task));
      callback(tasks);
    });
  }
};

// ==================== SNIPPETS ====================
export const snippetsService = {
  async getAll(): Promise<Snippet[]> {
    const q = query(collection(db, COLLECTIONS.SNIPPETS), orderBy('title', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Snippet));
  },

  async getById(id: string): Promise<Snippet | null> {
    const docRef = doc(db, COLLECTIONS.SNIPPETS, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Snippet;
    }
    return null;
  },

  async create(snippet: Omit<Snippet, 'id'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.SNIPPETS));
    await setDoc(docRef, snippet);
    return docRef.id;
  },

  async update(id: string, updates: Partial<Snippet>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SNIPPETS, id);
    await updateDoc(docRef, updates as any);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SNIPPETS, id);
    await deleteDoc(docRef);
  },

  subscribe(callback: (snippets: Snippet[]) => void): Unsubscribe {
    const q = query(collection(db, COLLECTIONS.SNIPPETS), orderBy('title', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const snippets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Snippet));
      callback(snippets);
    });
  }
};

// ==================== VAULT ====================
export const vaultService = {
  async getAll(): Promise<VaultItem[]> {
    const q = query(collection(db, COLLECTIONS.VAULT), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt
    } as VaultItem));
  },

  async getById(id: string): Promise<VaultItem | null> {
    const docRef = doc(db, COLLECTIONS.VAULT, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt
      } as VaultItem;
    }
    return null;
  },

  async create(item: Omit<VaultItem, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.VAULT));
    await setDoc(docRef, {
      ...item,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<VaultItem>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.VAULT, id);
    await updateDoc(docRef, updates as any);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.VAULT, id);
    await deleteDoc(docRef);
  },

  subscribe(callback: (items: VaultItem[]) => void): Unsubscribe {
    const q = query(collection(db, COLLECTIONS.VAULT), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt
        } as VaultItem;
      });
      callback(items);
    });
  }
};
