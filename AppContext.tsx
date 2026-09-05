import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ContractDeadline, Project, ProjectId, Snippet, Task, TaskPriority, VaultItem } from './types';
import {
  deadlinesService,
  projectsService,
  snippetsService,
  tasksService,
  vaultService,
} from './src/services/firestoreService';
import './src/config/firebase';

interface AppContextType {
  projects: Project[];
  tasks: Task[];
  snippets: Snippet[];
  deadlines: ContractDeadline[];
  vaultItems: VaultItem[];
  isLoading: boolean;
  dataError: string | null;
  clearDataError: () => void;
  addTask: (projectId: ProjectId, description: string, priority?: TaskPriority) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addSnippet: (snippet: Omit<Snippet, 'id'>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  addDeadline: (deadline: Omit<ContractDeadline, 'id'>) => Promise<void>;
  updateDeadline: (id: string, updates: Partial<ContractDeadline>) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;
  addVaultItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteVaultItem: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CACHE_KEYS = {
  projects: 'wt_projects',
  tasks: 'wt_tasks',
  snippets: 'wt_snippets',
  vaultItems: 'wt_vault',
  deadlines: 'wt_deadlines',
} as const;

type CacheKey = keyof typeof CACHE_KEYS;

const readCache = <T,>(key: CacheKey): T[] => {
  try {
    const saved = localStorage.getItem(CACHE_KEYS[key]);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const writeCache = (key: CacheKey, value: unknown[]) => {
  try {
    localStorage.setItem(CACHE_KEYS[key], JSON.stringify(value));
  } catch {
    // Cache indisponivel nao deve interromper a aplicacao.
  }
};

const readableError = (action: string, error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code.includes('permission-denied')) {
    return `${action}: sua conta nao tem permissao no Firestore. Revise as regras publicadas.`;
  }
  if (code.includes('unavailable')) {
    return `${action}: o banco esta indisponivel. Os ultimos dados salvos continuam visiveis.`;
  }
  return `${action}. Verifique sua conexao e tente novamente.`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [deadlines, setDeadlines] = useState<ContractDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const clearDataError = useCallback(() => setDataError(null), []);
  const reportError = useCallback((action: string, error: unknown) => {
    console.error(action, error);
    setDataError(readableError(action, error));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const initializeData = async () => {
      const loaders = [
        { key: 'projects' as const, load: projectsService.getAll, set: setProjects },
        { key: 'tasks' as const, load: tasksService.getAll, set: setTasks },
        { key: 'snippets' as const, load: snippetsService.getAll, set: setSnippets },
        { key: 'vaultItems' as const, load: vaultService.getAll, set: setVaultItems },
        { key: 'deadlines' as const, load: deadlinesService.getAll, set: setDeadlines },
      ];

      // Timeout de seguranca para evitar carregamento infinito
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 4000));
      const results: any = await Promise.race([
        Promise.allSettled(loaders.map(({ load }) => load())),
        timeoutPromise.then(() => null)
      ]);

      if (cancelled) return;
      if (!results) {
        loaders.forEach((loader) => {
          (loader.set as React.Dispatch<React.SetStateAction<any[]>>)(readCache(loader.key));
        });
        setIsLoading(false);
        return;
      }

      const failed: string[] = [];
      results.forEach((result, index) => {
        const loader = loaders[index];
        if (result.status === 'fulfilled') {
          (loader.set as React.Dispatch<React.SetStateAction<any[]>>)(result.value);
          writeCache(loader.key, result.value);
        } else {
          failed.push(loader.key);
          (loader.set as React.Dispatch<React.SetStateAction<any[]>>)(readCache(loader.key));
          console.error(`Falha ao carregar ${loader.key}`, result.reason);
        }
      });

      if (failed.length) {
        setDataError(`Nao foi possivel sincronizar: ${failed.join(', ')}. Exibindo o ultimo cache disponivel.`);
      }
      setIsLoading(false);

      const listenerError = (resource: string) => (error: Error) => reportError(`Falha ao sincronizar ${resource}`, error);
      cleanups.push(
        projectsService.subscribe((value) => { setProjects(value); writeCache('projects', value); }, listenerError('projetos')),
        tasksService.subscribe((value) => { setTasks(value); writeCache('tasks', value); }, listenerError('tarefas')),
        snippetsService.subscribe((value) => { setSnippets(value); writeCache('snippets', value); }, listenerError('snippets')),
        vaultService.subscribe((value) => { setVaultItems(value); writeCache('vaultItems', value); }, listenerError('cofre')),
        deadlinesService.subscribe((value) => { setDeadlines(value); writeCache('deadlines', value); }, listenerError('agenda')),
      );
    };

    initializeData().catch((error) => {
      if (!cancelled) {
        reportError('Falha ao inicializar os dados', error);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [reportError]);

  const runAction = useCallback(async (action: string, operation: () => Promise<unknown>) => {
    setDataError(null);
    try {
      await operation();
    } catch (error) {
      reportError(action, error);
      throw error;
    }
  }, [reportError]);

  const addTask = useCallback((projectId: ProjectId, description: string, priority: TaskPriority = TaskPriority.NORMAL) =>
    runAction('Nao foi possivel adicionar a tarefa', () => tasksService.create({
      projectId,
      description,
      priority,
      isCompleted: false,
      createdAt: Date.now(),
    })), [runAction]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) throw new Error('Tarefa nao encontrada');
    await runAction('Nao foi possivel atualizar a tarefa', () => tasksService.update(taskId, { isCompleted: !task.isCompleted }));
  }, [runAction, tasks]);

  const deleteTask = useCallback((id: string) =>
    runAction('Nao foi possivel excluir a tarefa', () => tasksService.delete(id)), [runAction]);
  const addSnippet = useCallback((snippet: Omit<Snippet, 'id'>) =>
    runAction('Nao foi possivel salvar o snippet', () => snippetsService.create(snippet)), [runAction]);
  const deleteSnippet = useCallback((id: string) =>
    runAction('Nao foi possivel excluir o snippet', () => snippetsService.delete(id)), [runAction]);
  const addDeadline = useCallback((deadline: Omit<ContractDeadline, 'id'>) =>
    runAction('Nao foi possivel salvar o marco', () => deadlinesService.create(deadline)), [runAction]);
  const updateDeadline = useCallback((id: string, updates: Partial<ContractDeadline>) =>
    runAction('Nao foi possivel atualizar o marco', () => deadlinesService.update(id, updates)), [runAction]);
  const deleteDeadline = useCallback((id: string) =>
    runAction('Nao foi possivel excluir o marco', () => deadlinesService.delete(id)), [runAction]);
  const addVaultItem = useCallback((item: Omit<VaultItem, 'id' | 'createdAt'>) =>
    runAction('Nao foi possivel salvar o item no cofre', () => vaultService.create(item)), [runAction]);
  const deleteVaultItem = useCallback((id: string) =>
    runAction('Nao foi possivel excluir o item do cofre', () => vaultService.delete(id)), [runAction]);
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) =>
    runAction('Nao foi possivel adicionar o projeto', () => projectsService.create(project)), [runAction]);
  const updateProject = useCallback((id: string, updates: Partial<Project>) =>
    runAction('Nao foi possivel atualizar o projeto', () => projectsService.update(id, updates)), [runAction]);
  const deleteProject = useCallback((id: string) =>
    runAction('Nao foi possivel excluir o projeto', () => projectsService.delete(id)), [runAction]);

  return (
    <AppContext.Provider value={{
      projects, tasks, snippets, deadlines, vaultItems, isLoading, dataError, clearDataError,
      addTask, toggleTask, deleteTask, addSnippet, deleteSnippet,
      addDeadline, updateDeadline, deleteDeadline,
      addVaultItem, deleteVaultItem, addProject, updateProject, deleteProject,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
