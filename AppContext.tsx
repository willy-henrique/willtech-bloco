import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Project, Task, Snippet, ContractDeadline, ProjectId, TaskPriority, VaultItem } from './types';
import type { CalendarEvent, Item, Note } from './types/item';
import { INITIAL_PROJECTS, INITIAL_SNIPPETS, INITIAL_DEADLINES } from './constants';
import { tasksService, snippetsService, vaultService, projectsService } from './src/services/firestoreService';
import { notesService } from './services/notesService';
import { eventsService } from './services/eventsService';
import {
  CaptureOptions,
  INBOX_PROJECT_ID,
  buildItems,
  defaultTaskPriority,
  parseCaptureIntent,
} from './lib/domain';
import { todayAt, tomorrowAt } from './lib/dates';
import './src/config/firebase';

export type QuickCaptureInput = CaptureOptions;

interface AppContextType {
  projects: Project[];
  tasks: Task[];
  notes: Note[];
  events: CalendarEvent[];
  snippets: Snippet[];
  deadlines: ContractDeadline[];
  vaultItems: VaultItem[];
  items: Item[];
  isLoading: boolean;
  addTask: (
    projectId: ProjectId,
    description: string,
    priority?: TaskPriority,
    extras?: Partial<Task>
  ) => Promise<string>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  captureQuick: (input: QuickCaptureInput) => Promise<{ id: string; kind: string }>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addSnippet: (snippet: Omit<Snippet, 'id'>) => Promise<void>;
  addVaultItem: (item: Omit<VaultItem, 'id' | 'createdAt'>) => Promise<void>;
  deleteVaultItem: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<string | void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [deadlines] = useState<ContractDeadline[]>(INITIAL_DEADLINES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const initializeData = async () => {
      try {
        const [initialProjects, initialTasks, initialSnippets, initialVault, initialNotes, initialEvents] =
          await Promise.all([
            projectsService.getAll().catch(() => []),
            tasksService.getAll().catch(() => []),
            snippetsService.getAll().catch(() => INITIAL_SNIPPETS),
            vaultService.getAll().catch(() => []),
            notesService.getAll().catch(() => []),
            eventsService.getAll().catch(() => []),
          ]);

        if (initialProjects.length === 0) {
          const migratedProjects: Project[] = [];
          let hasPermissionError = false;
          for (const project of INITIAL_PROJECTS) {
            try {
              const id = await projectsService.create(project);
              migratedProjects.push({ ...project, id, createdAt: Date.now() });
            } catch (error: unknown) {
              const err = error as { code?: string };
              if (err?.code === 'permission-denied') {
                hasPermissionError = true;
                break;
              }
            }
          }
          if (!hasPermissionError && migratedProjects.length > 0) {
            setProjects(migratedProjects);
          } else if (hasPermissionError) {
            setProjects(
              INITIAL_PROJECTS.map((p) => ({ ...p, id: Math.random().toString(36), createdAt: Date.now() }))
            );
          } else {
            setProjects([]);
          }
        } else {
          setProjects(initialProjects);
        }

        setTasks(initialTasks);
        setNotes(initialNotes);
        setEvents(initialEvents);
        setSnippets(initialSnippets.length > 0 ? initialSnippets : INITIAL_SNIPPETS);
        setVaultItems(initialVault);
        setIsLoading(false);

        unsubs.push(projectsService.subscribe(setProjects));
        unsubs.push(tasksService.subscribe(setTasks));
        unsubs.push(
          snippetsService.subscribe((s) => setSnippets(s.length > 0 ? s : INITIAL_SNIPPETS))
        );
        unsubs.push(vaultService.subscribe(setVaultItems));
        unsubs.push(notesService.subscribe(setNotes));
        unsubs.push(eventsService.subscribe(setEvents));
      } catch (error) {
        console.error('Erro ao inicializar dados:', error);
        setIsLoading(false);
        const savedProjects = localStorage.getItem('wt_projects');
        const savedTasks = localStorage.getItem('wt_tasks');
        const savedNotes = localStorage.getItem('wt_notes');
        const savedEvents = localStorage.getItem('wt_events');
        if (savedProjects) setProjects(JSON.parse(savedProjects));
        else {
          setProjects(
            INITIAL_PROJECTS.map((p) => ({ ...p, id: Math.random().toString(36), createdAt: Date.now() }))
          );
        }
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedNotes) setNotes(JSON.parse(savedNotes));
        if (savedEvents) setEvents(JSON.parse(savedEvents));
        setSnippets(INITIAL_SNIPPETS);
      }
    };

    initializeData();
    return () => unsubs.forEach((u) => u());
  }, []);

  const items = useMemo(
    () => buildItems({ tasks, notes, events, projects }),
    [tasks, notes, events, projects]
  );

  const addTask = useCallback(
    async (
      projectId: ProjectId,
      description: string,
      priority: TaskPriority = TaskPriority.NORMAL,
      extras: Partial<Task> = {}
    ) => {
      const id = await tasksService.create({
        projectId,
        description,
        priority,
        isCompleted: false,
        createdAt: Date.now(),
        ...extras,
      });
      return id;
    },
    []
  );

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    await tasksService.update(taskId, updates);
  }, []);

  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      await tasksService.update(taskId, {
        isCompleted: !task.isCompleted,
        status: !task.isCompleted ? 'completed' : 'active',
      });
    },
    [tasks]
  );

  const deleteTask = useCallback(async (taskId: string) => {
    await tasksService.delete(taskId);
  }, []);

  const addNote = useCallback(async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    return notesService.create(note);
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    await notesService.update(id, updates);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await notesService.delete(id);
  }, []);

  const addEvent = useCallback(
    async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
      return eventsService.create(event);
    },
    []
  );

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    await eventsService.update(id, updates);
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await eventsService.delete(id);
  }, []);

  const captureQuick = useCallback(
    async (input: QuickCaptureInput) => {
      const { title, dueHint } = parseCaptureIntent(input.text);
      let dueAt = input.dueAt ?? null;
      if (dueAt == null && dueHint === 'today') dueAt = todayAt(9);
      if (dueAt == null && dueHint === 'tomorrow') dueAt = tomorrowAt(9);

      if (input.asNote) {
        const id = await notesService.create({
          title: title.slice(0, 80) || 'Nota',
          content: input.text,
          projectId: input.projectId ?? null,
        });
        return { id, kind: 'note' };
      }

      if (input.asEvent || input.asReminder) {
        const scheduledAt = input.reminderAt || dueAt || todayAt(9);
        const id = await eventsService.create({
          title,
          content: input.text,
          kind: input.asReminder ? 'reminder' : 'event',
          scheduledAt,
          projectId: input.projectId ?? null,
        });
        return { id, kind: input.asReminder ? 'reminder' : 'event' };
      }

      const projectId = input.projectId || INBOX_PROJECT_ID;
      const inbox = !input.projectId;
      const id = await tasksService.create({
        projectId,
        description: title,
        title,
        priority: defaultTaskPriority(),
        isCompleted: false,
        createdAt: Date.now(),
        inbox,
        status: inbox ? 'inbox' : 'active',
        dueAt,
        reminderAt: input.reminderAt ?? null,
      });
      return { id, kind: 'task' };
    },
    []
  );

  const addSnippet = useCallback(async (snippet: Omit<Snippet, 'id'>) => {
    await snippetsService.create(snippet);
  }, []);

  const addVaultItem = useCallback(async (item: Omit<VaultItem, 'id' | 'createdAt'>) => {
    await vaultService.create(item);
  }, []);

  const deleteVaultItem = useCallback(async (id: string) => {
    await vaultService.delete(id);
  }, []);

  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt'>) => {
    return projectsService.create(project);
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    await projectsService.update(id, updates);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await projectsService.delete(id);
  }, []);

  const value: AppContextType = {
    projects,
    tasks,
    notes,
    events,
    snippets,
    deadlines,
    vaultItems,
    items,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    captureQuick,
    addNote,
    updateNote,
    deleteNote,
    addEvent,
    updateEvent,
    deleteEvent,
    addSnippet,
    addVaultItem,
    deleteVaultItem,
    addProject,
    updateProject,
    deleteProject,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
