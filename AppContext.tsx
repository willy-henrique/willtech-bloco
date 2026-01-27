
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Task, Snippet, ContractDeadline, ProjectId, TaskPriority, VaultItem } from './types';
import { INITIAL_PROJECTS, INITIAL_SNIPPETS, INITIAL_DEADLINES } from './constants';
import { tasksService, snippetsService, vaultService } from './src/services/firestoreService';
import './src/config/firebase'; // Inicializa Firebase

interface AppContextType {
  projects: Project[];
  tasks: Task[];
  snippets: Snippet[];
  deadlines: ContractDeadline[];
  vaultItems: VaultItem[];
  isLoading: boolean;
  addTask: (projectId: ProjectId, description: string, priority?: TaskPriority) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addSnippet: (snippet: Omit<Snippet, 'id'>) => Promise<void>;
  addVaultItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteVaultItem: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [deadlines] = useState<ContractDeadline[]>(INITIAL_DEADLINES);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar dados do Firestore e configurar listeners em tempo real
  useEffect(() => {
    let unsubscribeTasks: (() => void) | null = null;
    let unsubscribeSnippets: (() => void) | null = null;
    let unsubscribeVault: (() => void) | null = null;

    const initializeData = async () => {
      try {
        // Carregar dados iniciais
        const [initialTasks, initialSnippets, initialVault] = await Promise.all([
          tasksService.getAll().catch(() => []),
          snippetsService.getAll().catch(() => INITIAL_SNIPPETS),
          vaultService.getAll().catch(() => [])
        ]);

        setTasks(initialTasks);
        setSnippets(initialSnippets.length > 0 ? initialSnippets : INITIAL_SNIPPETS);
        setVaultItems(initialVault);
        setIsLoading(false);

        // Configurar listeners em tempo real
        unsubscribeTasks = tasksService.subscribe((updatedTasks) => {
          setTasks(updatedTasks);
        });

        unsubscribeSnippets = snippetsService.subscribe((updatedSnippets) => {
          setSnippets(updatedSnippets.length > 0 ? updatedSnippets : INITIAL_SNIPPETS);
        });

        unsubscribeVault = vaultService.subscribe((updatedVault) => {
          setVaultItems(updatedVault);
        });
      } catch (error) {
        console.error('Erro ao inicializar dados do Firestore:', error);
        setIsLoading(false);
        // Fallback para localStorage em caso de erro
        const savedTasks = localStorage.getItem('wt_tasks');
        const savedSnippets = localStorage.getItem('wt_snippets');
        const savedVault = localStorage.getItem('wt_vault');
        
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedSnippets) setSnippets(JSON.parse(savedSnippets));
        else setSnippets(INITIAL_SNIPPETS);
        if (savedVault) setVaultItems(JSON.parse(savedVault));
      }
    };

    initializeData();

    // Cleanup: remover listeners ao desmontar
    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeSnippets) unsubscribeSnippets();
      if (unsubscribeVault) unsubscribeVault();
    };
  }, []);

  const addTask = useCallback(async (projectId: ProjectId, description: string, priority: TaskPriority = TaskPriority.NORMAL) => {
    try {
      await tasksService.create({
        projectId,
        description,
        priority,
        isCompleted: false,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      throw error;
    }
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await tasksService.update(taskId, { isCompleted: !task.isCompleted });
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      throw error;
    }
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await tasksService.delete(taskId);
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      throw error;
    }
  }, []);

  const addSnippet = useCallback(async (snippet: Omit<Snippet, 'id'>) => {
    try {
      await snippetsService.create(snippet);
    } catch (error) {
      console.error('Erro ao adicionar snippet:', error);
      throw error;
    }
  }, []);

  const addVaultItem = useCallback(async (item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    try {
      await vaultService.create(item);
    } catch (error) {
      console.error('Erro ao adicionar item ao vault:', error);
      throw error;
    }
  }, []);

  const deleteVaultItem = useCallback(async (id: string) => {
    try {
      await vaultService.delete(id);
    } catch (error) {
      console.error('Erro ao deletar item do vault:', error);
      throw error;
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      projects, tasks, snippets, deadlines, vaultItems, isLoading,
      addTask, toggleTask, deleteTask, addSnippet, addVaultItem, deleteVaultItem 
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
