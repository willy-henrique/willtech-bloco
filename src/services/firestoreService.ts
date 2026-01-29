import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  query, 
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, Snippet, VaultItem, Project, ProjectCredential, ProjectPayment, ProjectNote, ProjectDetail } from '../../types';

// Coleções do Firestore
const COLLECTIONS = {
  TASKS: 'tasks',
  SNIPPETS: 'snippets',
  VAULT: 'vault',
  PROJECTS: 'projects',
  PROJECT_CREDENTIALS: 'project_credentials',
  PROJECT_PAYMENTS: 'project_payments',
  PROJECT_NOTES: 'project_notes',
  PROJECT_DETAILS: 'project_details'
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

// ==================== PROJECTS ====================
export const projectsService = {
  async getAll(): Promise<Project[]> {
    try {
      const q = query(collection(db, COLLECTIONS.PROJECTS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
        } as Project;
      });
    } catch (error: any) {
      // Se o erro for por falta de índice, tentar sem orderBy
      if (error?.code === 'failed-precondition') {
        console.warn('Índice não criado. Buscando sem ordenação...');
        const snapshot = await getDocs(collection(db, COLLECTIONS.PROJECTS));
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
          } as Project;
        });
      }
      throw error;
    }
  },

  async getById(id: string): Promise<Project | null> {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
      } as Project;
    }
    return null;
  },

  async create(project: Omit<Project, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.PROJECTS));
    await setDoc(docRef, {
      ...project,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    await updateDoc(docRef, updates as any);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    await deleteDoc(docRef);
  },

  subscribe(callback: (projects: Project[]) => void): Unsubscribe {
    let unsubscribe: Unsubscribe;
    
    try {
      const q = query(collection(db, COLLECTIONS.PROJECTS), orderBy('createdAt', 'desc'));
      unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const projects = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
            } as Project;
          });
          // Sempre chamar callback com os projetos do Firestore
          callback(projects);
        },
        (error: any) => {
          console.error('Erro no listener de projetos:', error);
          // Se for erro de índice, tentar sem orderBy
          if (error?.code === 'failed-precondition') {
            console.warn('Índice não criado. Usando listener sem ordenação...');
            const qWithoutOrder = query(collection(db, COLLECTIONS.PROJECTS));
            unsubscribe = onSnapshot(qWithoutOrder, (snapshot) => {
              const projects = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
                } as Project;
              });
              callback(projects);
            });
          }
          // Em caso de outro erro, não chamar callback para não perder os projetos atuais
        }
      );
    } catch (error) {
      // Se não conseguir criar query com orderBy, usar sem ordenação
      const q = query(collection(db, COLLECTIONS.PROJECTS));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
          } as Project;
        });
        callback(projects);
      });
    }
    
    return unsubscribe;
  }
};

// ==================== PROJECT CREDENTIALS ====================
export const projectCredentialsService = {
  async getByProjectId(projectId: string): Promise<ProjectCredential[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROJECT_CREDENTIALS),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
        } as ProjectCredential;
      });
    } catch (error: any) {
      // Se o erro for por falta de índice, tentar sem orderBy
      if (error?.code === 'failed-precondition') {
        console.warn('Índice não criado para project_credentials. Buscando sem ordenação...');
        const q = query(
          collection(db, COLLECTIONS.PROJECT_CREDENTIALS),
          where('projectId', '==', projectId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
          } as ProjectCredential;
        }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      throw error;
    }
  },

  async create(credential: Omit<ProjectCredential, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.PROJECT_CREDENTIALS));
    
    // Remover campos undefined/null antes de salvar no Firestore
    const cleanData: any = {
      projectId: credential.projectId,
      title: credential.title,
      createdAt: Timestamp.now()
    };
    
    // Adicionar apenas campos que têm valor (não são undefined/null)
    if (credential.username !== undefined && credential.username !== null && credential.username !== '') {
      cleanData.username = credential.username;
    }
    if (credential.email !== undefined && credential.email !== null && credential.email !== '') {
      cleanData.email = credential.email;
    }
    if (credential.password !== undefined && credential.password !== null && credential.password !== '') {
      cleanData.password = credential.password;
    }
    if (credential.url !== undefined && credential.url !== null && credential.url !== '') {
      cleanData.url = credential.url;
    }
    if (credential.env !== undefined && credential.env !== null && credential.env !== '') {
      cleanData.env = credential.env;
    }
    if (credential.notes !== undefined && credential.notes !== null && credential.notes !== '') {
      cleanData.notes = credential.notes;
    }
    
    await setDoc(docRef, cleanData);
    return docRef.id;
  },

  async update(id: string, updates: Partial<ProjectCredential>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECT_CREDENTIALS, id);
    
    // Remover campos undefined/null antes de atualizar no Firestore
    const cleanUpdates: any = {};
    
    // Adicionar apenas campos que têm valor (não são undefined/null/vazios)
    if (updates.title !== undefined && updates.title !== null && updates.title.trim() !== '') {
      cleanUpdates.title = updates.title.trim();
    }
    if (updates.username !== undefined) {
      if (updates.username !== null && updates.username.trim() !== '') {
        cleanUpdates.username = updates.username.trim();
      } else {
        // Se for string vazia ou null, remover o campo do documento
        cleanUpdates.username = deleteField();
      }
    }
    if (updates.email !== undefined) {
      if (updates.email !== null && updates.email.trim() !== '') {
        cleanUpdates.email = updates.email.trim();
      } else {
        cleanUpdates.email = deleteField();
      }
    }
    if (updates.password !== undefined) {
      if (updates.password !== null && updates.password.trim() !== '') {
        cleanUpdates.password = updates.password.trim();
      } else {
        cleanUpdates.password = deleteField();
      }
    }
    if (updates.url !== undefined) {
      if (updates.url !== null && updates.url.trim() !== '') {
        cleanUpdates.url = updates.url.trim();
      } else {
        cleanUpdates.url = deleteField();
      }
    }
    if (updates.env !== undefined) {
      if (updates.env !== null && updates.env.trim() !== '') {
        cleanUpdates.env = updates.env.trim();
      } else {
        cleanUpdates.env = deleteField();
      }
    }
    if (updates.notes !== undefined) {
      if (updates.notes !== null && updates.notes.trim() !== '') {
        cleanUpdates.notes = updates.notes.trim();
      } else {
        cleanUpdates.notes = deleteField();
      }
    }
    
    await updateDoc(docRef, cleanUpdates);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECT_CREDENTIALS, id);
    await deleteDoc(docRef);
  }
};

// ==================== PROJECT PAYMENTS ====================
export const projectPaymentsService = {
  async getByProjectId(projectId: string): Promise<ProjectPayment[]> {
    const q = query(
      collection(db, COLLECTIONS.PROJECT_PAYMENTS),
      where('projectId', '==', projectId),
      orderBy('dueDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now()
      } as ProjectPayment;
    });
  },

  async create(payment: Omit<ProjectPayment, 'id' | 'createdAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.PROJECT_PAYMENTS));
    await setDoc(docRef, {
      ...payment,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<ProjectPayment>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECT_PAYMENTS, id);
    await updateDoc(docRef, updates as any);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECT_PAYMENTS, id);
    await deleteDoc(docRef);
  }
};

// ==================== PROJECT NOTES ====================
export const projectNotesService = {
  async getByProjectId(projectId: string): Promise<ProjectNote[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROJECT_NOTES),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt
        } as ProjectNote;
      });
    } catch (error: any) {
      // Se o erro for por falta de índice, tentar sem orderBy
      if (error?.code === 'failed-precondition') {
        console.warn('Índice não criado para project_notes. Buscando sem ordenação...');
        const q = query(
          collection(db, COLLECTIONS.PROJECT_NOTES),
          where('projectId', '==', projectId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
            updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt
          } as ProjectNote;
        }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      throw error;
    }
  },

  async create(note: Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTIONS.PROJECT_NOTES));
    await setDoc(docRef, {
      ...note,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<ProjectNote>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECT_NOTES, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    } as any);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PROJECT_NOTES, id);
    await deleteDoc(docRef);
  }
};

// ==================== PROJECT DETAILS ====================
export const projectDetailsService = {
  async getByProjectId(projectId: string): Promise<ProjectDetail | null> {
    const q = query(
      collection(db, COLLECTIONS.PROJECT_DETAILS),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      projectId,
      ...data,
      createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
      updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt
    } as ProjectDetail;
  },

  async createOrUpdate(detail: Omit<ProjectDetail, 'createdAt' | 'updatedAt'>): Promise<void> {
    const q = query(
      collection(db, COLLECTIONS.PROJECT_DETAILS),
      where('projectId', '==', detail.projectId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      const docRef = doc(collection(db, COLLECTIONS.PROJECT_DETAILS));
      await setDoc(docRef, {
        ...detail,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } else {
      const docRef = doc(db, COLLECTIONS.PROJECT_DETAILS, snapshot.docs[0].id);
      await updateDoc(docRef, {
        ...detail,
        updatedAt: Timestamp.now()
      } as any);
    }
  }
};
