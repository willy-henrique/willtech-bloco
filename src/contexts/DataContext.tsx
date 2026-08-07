import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LocalRepository } from '../repositories/localRepository';
import { useAuth } from './AuthContext';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_PREFERENCES } from '../constants/defaults';
import { toDateKey } from '../lib/dates';
import { createId } from '../lib/id';
import { storageKey, writeJSON, readJSON } from '../lib/storage';
import type {
  AiConversation,
  AiMessage,
  AiToolExecution,
  AppNotification,
  AuditLog,
  CalendarEvent,
  CollectionName,
  FinancialAccount,
  FinancialCategory,
  Goal,
  Habit,
  HabitEntry,
  Note,
  Project,
  Reminder,
  SavedLink,
  Task,
  Transaction,
  UserPreferences,
} from '../types';

interface DataContextValue {
  ready: boolean;
  preferences: UserPreferences;
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  events: CalendarEvent[];
  reminders: Reminder[];
  transactions: Transaction[];
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  habits: Habit[];
  habitEntries: HabitEntry[];
  goals: Goal[];
  savedLinks: SavedLink[];
  notifications: AppNotification[];
  aiConversations: AiConversation[];
  aiMessages: AiMessage[];
  aiToolExecutions: AiToolExecution[];
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  createTask: (data: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => Task | null;
  deleteTask: (id: string) => boolean;
  toggleTaskDone: (id: string) => Task | null;
  createProject: (data: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => Project | null;
  deleteProject: (id: string) => boolean;
  createNote: (data: Partial<Note> & { title: string }) => Note;
  updateNote: (id: string, updates: Partial<Note>) => Note | null;
  deleteNote: (id: string) => boolean;
  createEvent: (data: Partial<CalendarEvent> & { title: string; date: string }) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => CalendarEvent | null;
  deleteEvent: (id: string) => boolean;
  createReminder: (data: { title: string; dueAt?: number }) => Reminder;
  completeReminder: (id: string) => Reminder | null;
  deleteReminder: (id: string) => boolean;
  createTransaction: (data: Partial<Transaction> & { description: string; amount: number; type: Transaction['type']; dueDate: string }) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Transaction | null;
  deleteTransaction: (id: string) => boolean;
  createHabit: (data: Partial<Habit> & { title: string }) => Habit;
  toggleHabitToday: (habitId: string) => void;
  createGoal: (data: Partial<Goal> & { title: string; targetValue: number }) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => Goal | null;
  deleteGoal: (id: string) => boolean;
  createSavedLink: (data: Partial<SavedLink> & { title: string; url: string }) => SavedLink;
  updateSavedLink: (id: string, updates: Partial<SavedLink>) => SavedLink | null;
  deleteSavedLink: (id: string) => boolean;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  createAiConversation: (title?: string) => AiConversation;
  addAiMessage: (data: Partial<AiMessage> & { conversationId: string; role: AiMessage['role']; content: string }) => AiMessage;
  proposeToolExecution: (data: Omit<AiToolExecution, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => AiToolExecution;
  confirmToolExecution: (id: string) => AiToolExecution | null;
  rejectToolExecution: (id: string) => AiToolExecution | null;
  refreshNotifications: () => void;
  exportData: () => string;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function useRepo<T extends object>(userId: string | undefined, collection: CollectionName) {
  return useMemo(
    () => (userId ? new LocalRepository<T>(userId, collection) : null),
    [userId, collection],
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const tasksRepo = useRepo<Omit<Task, keyof import('../types').BaseEntity>>(userId, 'tasks');
  const projectsRepo = useRepo<Omit<Project, keyof import('../types').BaseEntity>>(userId, 'projects');
  const notesRepo = useRepo<Omit<Note, keyof import('../types').BaseEntity>>(userId, 'notes');
  const eventsRepo = useRepo<Omit<CalendarEvent, keyof import('../types').BaseEntity>>(userId, 'events');
  const remindersRepo = useRepo<Omit<Reminder, keyof import('../types').BaseEntity>>(userId, 'reminders');
  const transactionsRepo = useRepo<Omit<Transaction, keyof import('../types').BaseEntity>>(userId, 'transactions');
  const accountsRepo = useRepo<Omit<FinancialAccount, keyof import('../types').BaseEntity>>(userId, 'accounts');
  const categoriesRepo = useRepo<Omit<FinancialCategory, keyof import('../types').BaseEntity>>(userId, 'categories');
  const habitsRepo = useRepo<Omit<Habit, keyof import('../types').BaseEntity>>(userId, 'habits');
  const habitEntriesRepo = useRepo<Omit<HabitEntry, keyof import('../types').BaseEntity>>(userId, 'habitEntries');
  const goalsRepo = useRepo<Omit<Goal, keyof import('../types').BaseEntity>>(userId, 'goals');
  const savedLinksRepo = useRepo<Omit<SavedLink, keyof import('../types').BaseEntity>>(userId, 'savedLinks');
  const notificationsRepo = useRepo<Omit<AppNotification, keyof import('../types').BaseEntity>>(userId, 'notifications');
  const aiConversationsRepo = useRepo<Omit<AiConversation, keyof import('../types').BaseEntity>>(userId, 'aiConversations');
  const aiMessagesRepo = useRepo<Omit<AiMessage, keyof import('../types').BaseEntity>>(userId, 'aiMessages');
  const aiToolExecutionsRepo = useRepo<Omit<AiToolExecution, keyof import('../types').BaseEntity>>(userId, 'aiToolExecutions');
  const auditRepo = useRepo<Omit<AuditLog, keyof import('../types').BaseEntity>>(userId, 'auditLogs');

  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitEntries, setHabitEntries] = useState<HabitEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [aiConversations, setAiConversations] = useState<AiConversation[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiToolExecutions, setAiToolExecutions] = useState<AiToolExecution[]>([]);

  const reload = useCallback(() => {
    if (!userId || !tasksRepo) {
      setReady(false);
      return;
    }

    const prefsKey = storageKey(userId, 'preferences');
    let prefs = readJSON<UserPreferences | null>(prefsKey, null);
    if (!prefs) {
      prefs = {
        userId,
        ...DEFAULT_PREFERENCES,
        updatedAt: Date.now(),
      };
      writeJSON(prefsKey, prefs);
    }

    if (accountsRepo && accountsRepo.list().length === 0) {
      DEFAULT_ACCOUNTS.forEach((account) => accountsRepo.create(account));
    }
    if (categoriesRepo && categoriesRepo.list().length === 0) {
      DEFAULT_CATEGORIES.forEach((category) => categoriesRepo.create(category));
    }

    setPreferences(prefs);
    setTasks(tasksRepo.list() as Task[]);
    setProjects(projectsRepo!.list() as Project[]);
    setNotes(notesRepo!.list() as Note[]);
    setEvents(eventsRepo!.list() as CalendarEvent[]);
    setReminders(remindersRepo!.list() as Reminder[]);
    setTransactions(transactionsRepo!.list() as Transaction[]);
    setAccounts(accountsRepo!.list() as FinancialAccount[]);
    setCategories(categoriesRepo!.list() as FinancialCategory[]);
    setHabits(habitsRepo!.list() as Habit[]);
    setHabitEntries(habitEntriesRepo!.list() as HabitEntry[]);
    setGoals(goalsRepo!.list() as Goal[]);
    setSavedLinks(savedLinksRepo!.list() as SavedLink[]);
    setNotifications(notificationsRepo!.list() as AppNotification[]);
    setAiConversations(aiConversationsRepo!.list() as AiConversation[]);
    setAiMessages(aiMessagesRepo!.list() as AiMessage[]);
    setAiToolExecutions(aiToolExecutionsRepo!.list() as AiToolExecution[]);
    setReady(true);
  }, [
    userId,
    tasksRepo,
    projectsRepo,
    notesRepo,
    eventsRepo,
    remindersRepo,
    transactionsRepo,
    accountsRepo,
    categoriesRepo,
    habitsRepo,
    habitEntriesRepo,
    goalsRepo,
    savedLinksRepo,
    notificationsRepo,
    aiConversationsRepo,
    aiMessagesRepo,
    aiToolExecutionsRepo,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);

  const audit = useCallback(
    (action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) => {
      auditRepo?.create({
        action,
        entityType,
        entityId,
        metadata,
        source: 'user',
      });
    },
    [auditRepo],
  );

  const refreshNotifications = useCallback(() => {
    if (!notificationsRepo || !userId) return;
    const today = toDateKey();
    const existing = notificationsRepo.list() as AppNotification[];
    const derived: Array<Omit<AppNotification, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>> = [];

    (tasksRepo?.list() as Task[]).forEach((task) => {
      if (task.status !== 'done' && task.dueDate && task.dueDate < today) {
        const key = `task_overdue:${task.id}`;
        if (!existing.some((n) => n.relatedId === key)) {
          derived.push({
            title: 'Tarefa atrasada',
            body: task.title,
            type: 'task_overdue',
            read: false,
            href: '/tarefas',
            relatedId: key,
          });
        }
      }
    });

    (eventsRepo?.list() as CalendarEvent[]).forEach((event) => {
      if (event.date === today) {
        const key = `event_upcoming:${event.id}:${today}`;
        if (!existing.some((n) => n.relatedId === key)) {
          derived.push({
            title: 'Compromisso de hoje',
            body: event.title,
            type: 'event_upcoming',
            read: false,
            href: '/agenda',
            relatedId: key,
          });
        }
      }
    });

    (goalsRepo?.list() as Goal[]).forEach((goal) => {
      if (goal.dueDate && goal.dueDate <= today && goal.status === 'active') {
        const key = `goal_deadline:${goal.id}`;
        if (!existing.some((n) => n.relatedId === key)) {
          derived.push({
            title: 'Meta com prazo próximo',
            body: goal.title,
            type: 'goal_deadline',
            read: false,
            href: '/habitos',
            relatedId: key,
          });
        }
      }
    });

    derived.forEach((item) => notificationsRepo.create(item));
    setNotifications(notificationsRepo.list() as AppNotification[]);
  }, [notificationsRepo, tasksRepo, eventsRepo, goalsRepo, userId]);

  useEffect(() => {
    if (ready) refreshNotifications();
  }, [ready, tasks, events, goals, refreshNotifications]);

  const value = useMemo<DataContextValue>(() => {
    const ensureReady = () => {
      if (!userId || !tasksRepo) throw new Error('Sessão indisponível');
    };

    return {
      ready,
      preferences: preferences || {
        userId: userId || 'anonymous',
        ...DEFAULT_PREFERENCES,
        updatedAt: 0,
      },
      tasks,
      projects,
      notes,
      events,
      reminders,
      transactions,
      accounts,
      categories,
      habits,
      habitEntries,
      goals,
      savedLinks,
      notifications,
      aiConversations,
      aiMessages,
      aiToolExecutions,
      updatePreferences: (updates) => {
        if (!userId || !preferences) return;
        const next = { ...preferences, ...updates, updatedAt: Date.now() };
        writeJSON(storageKey(userId, 'preferences'), next);
        setPreferences(next);
      },
      createTask: (data) => {
        ensureReady();
        const task = tasksRepo!.create({
          title: data.title,
          description: data.description || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          date: data.date ?? toDateKey(),
          time: data.time ?? null,
          dueDate: data.dueDate ?? data.date ?? null,
          projectId: data.projectId ?? null,
          category: data.category || '',
          tags: data.tags || [],
          subtasks: data.subtasks || [],
          checklist: data.checklist || [],
          notes: data.notes || '',
          reminderAt: data.reminderAt ?? null,
          recurrence: data.recurrence ?? null,
          attachments: data.attachments || [],
          completedAt: null,
        }) as Task;
        setTasks(tasksRepo!.list() as Task[]);
        audit('create', 'task', task.id);
        return task;
      },
      updateTask: (id, updates) => {
        const task = tasksRepo?.update(id, updates) as Task | null;
        if (task) {
          setTasks(tasksRepo!.list() as Task[]);
          audit('update', 'task', id);
        }
        return task;
      },
      deleteTask: (id) => {
        const ok = Boolean(tasksRepo?.softDelete(id));
        if (ok) {
          setTasks(tasksRepo!.list() as Task[]);
          audit('delete', 'task', id);
        }
        return ok;
      },
      toggleTaskDone: (id) => {
        const current = tasksRepo?.get(id) as Task | null;
        if (!current) return null;
        const done = current.status !== 'done';
        const task = tasksRepo!.update(id, {
          status: done ? 'done' : 'todo',
          completedAt: done ? Date.now() : null,
        }) as Task;
        setTasks(tasksRepo!.list() as Task[]);
        audit(done ? 'complete' : 'reopen', 'task', id);
        return task;
      },
      createProject: (data) => {
        const project = projectsRepo!.create({
          name: data.name,
          description: data.description || '',
          color: data.color || '#3fcf8e',
          icon: data.icon || 'FolderKanban',
          status: data.status || 'active',
          priority: data.priority || 'medium',
          startDate: data.startDate ?? toDateKey(),
          dueDate: data.dueDate ?? null,
          objective: data.objective || '',
          links: data.links || [],
        }) as Project;
        setProjects(projectsRepo!.list() as Project[]);
        audit('create', 'project', project.id);
        return project;
      },
      updateProject: (id, updates) => {
        const project = projectsRepo?.update(id, updates) as Project | null;
        if (project) setProjects(projectsRepo!.list() as Project[]);
        return project;
      },
      deleteProject: (id) => {
        const ok = Boolean(projectsRepo?.softDelete(id));
        if (ok) setProjects(projectsRepo!.list() as Project[]);
        return ok;
      },
      createNote: (data) => {
        const note = notesRepo!.create({
          title: data.title,
          content: data.content || '',
          category: data.category || '',
          tags: data.tags || [],
          pinned: data.pinned || false,
          favorite: data.favorite || false,
          archived: false,
          projectId: data.projectId ?? null,
          relatedLinks: data.relatedLinks || [],
        }) as Note;
        setNotes(notesRepo!.list() as Note[]);
        return note;
      },
      updateNote: (id, updates) => {
        const note = notesRepo?.update(id, updates) as Note | null;
        if (note) setNotes(notesRepo!.list() as Note[]);
        return note;
      },
      deleteNote: (id) => {
        const ok = Boolean(notesRepo?.softDelete(id));
        if (ok) setNotes(notesRepo!.list() as Note[]);
        return ok;
      },
      createEvent: (data) => {
        const event = eventsRepo!.create({
          title: data.title,
          description: data.description || '',
          date: data.date,
          startTime: data.startTime ?? null,
          endTime: data.endTime ?? null,
          allDay: data.allDay ?? !data.startTime,
          category: data.category || 'personal',
          location: data.location || '',
          meetingUrl: data.meetingUrl || '',
          reminderAt: data.reminderAt ?? null,
          recurrence: data.recurrence ?? null,
          participants: data.participants || [],
          relatedTaskId: data.relatedTaskId ?? null,
          notes: data.notes || '',
        }) as CalendarEvent;
        setEvents(eventsRepo!.list() as CalendarEvent[]);
        return event;
      },
      updateEvent: (id, updates) => {
        const event = eventsRepo?.update(id, updates) as CalendarEvent | null;
        if (event) setEvents(eventsRepo!.list() as CalendarEvent[]);
        return event;
      },
      deleteEvent: (id) => {
        const ok = Boolean(eventsRepo?.softDelete(id));
        if (ok) setEvents(eventsRepo!.list() as CalendarEvent[]);
        return ok;
      },
      createReminder: (data) => {
        ensureReady();
        const reminder = remindersRepo!.create({
          title: data.title,
          dueAt: data.dueAt ?? Date.now() + 60 * 60 * 1000,
          relatedId: null,
          completed: false,
        }) as Reminder;
        setReminders(remindersRepo!.list() as Reminder[]);
        audit('create', 'reminder', reminder.id);
        return reminder;
      },
      completeReminder: (id) => {
        const reminder = remindersRepo?.update(id, { completed: true }) as Reminder | null;
        if (reminder) setReminders(remindersRepo!.list() as Reminder[]);
        return reminder;
      },
      deleteReminder: (id) => {
        const ok = Boolean(remindersRepo?.softDelete(id));
        if (ok) setReminders(remindersRepo!.list() as Reminder[]);
        return ok;
      },
      createTransaction: (data) => {
        const tx = transactionsRepo!.create({
          description: data.description,
          type: data.type,
          amount: data.amount,
          currency: 'BRL',
          categoryId: data.categoryId ?? null,
          accountId: data.accountId ?? null,
          toAccountId: data.toAccountId ?? null,
          paymentMethod: data.paymentMethod || '',
          dueDate: data.dueDate,
          paidAt: data.status === 'paid' ? Date.now() : null,
          status: data.status || 'pending',
          notes: data.notes || '',
          recurring: data.recurring || false,
          recurrenceRule: data.recurrenceRule ?? null,
          projectId: data.projectId ?? null,
        }) as Transaction;
        setTransactions(transactionsRepo!.list() as Transaction[]);
        return tx;
      },
      updateTransaction: (id, updates) => {
        const tx = transactionsRepo?.update(id, updates) as Transaction | null;
        if (tx) setTransactions(transactionsRepo!.list() as Transaction[]);
        return tx;
      },
      deleteTransaction: (id) => {
        const ok = Boolean(transactionsRepo?.softDelete(id));
        if (ok) setTransactions(transactionsRepo!.list() as Transaction[]);
        return ok;
      },
      createHabit: (data) => {
        const habit = habitsRepo!.create({
          title: data.title,
          description: data.description || '',
          frequency: data.frequency || 'daily',
          weekDays: data.weekDays || [1, 2, 3, 4, 5],
          color: data.color || '#3fcf8e',
          archived: false,
          currentStreak: 0,
          bestStreak: 0,
          notes: data.notes || '',
        }) as Habit;
        setHabits(habitsRepo!.list() as Habit[]);
        return habit;
      },
      toggleHabitToday: (habitId) => {
        const today = toDateKey();
        const existing = (habitEntriesRepo!.list() as HabitEntry[]).find(
          (entry) => entry.habitId === habitId && entry.date === today,
        );
        if (existing) {
          habitEntriesRepo!.update(existing.id, { completed: !existing.completed });
        } else {
          habitEntriesRepo!.create({
            habitId,
            date: today,
            completed: true,
            note: '',
          });
        }

        const entries = habitEntriesRepo!.list() as HabitEntry[];
        const habitEntriesForHabit = entries
          .filter((entry) => entry.habitId === habitId && entry.completed)
          .map((entry) => entry.date)
          .sort();
        let streak = 0;
        let cursor = today;
        while (habitEntriesForHabit.includes(cursor)) {
          streak += 1;
          const d = new Date(`${cursor}T12:00:00`);
          d.setDate(d.getDate() - 1);
          cursor = toDateKey(d);
        }
        const habit = habitsRepo!.get(habitId) as Habit | null;
        if (habit) {
          habitsRepo!.update(habitId, {
            currentStreak: streak,
            bestStreak: Math.max(habit.bestStreak, streak),
          });
        }
        setHabitEntries(habitEntriesRepo!.list() as HabitEntry[]);
        setHabits(habitsRepo!.list() as Habit[]);
      },
      createGoal: (data) => {
        const goal = goalsRepo!.create({
          title: data.title,
          description: data.description || '',
          targetValue: data.targetValue,
          currentValue: data.currentValue || 0,
          unit: data.unit || '%',
          dueDate: data.dueDate ?? null,
          status: data.status || 'active',
          color: data.color || '#0284c7',
        }) as Goal;
        setGoals(goalsRepo!.list() as Goal[]);
        return goal;
      },
      updateGoal: (id, updates) => {
        const goal = goalsRepo?.update(id, updates) as Goal | null;
        if (goal) setGoals(goalsRepo!.list() as Goal[]);
        return goal;
      },
      deleteGoal: (id) => {
        const ok = Boolean(goalsRepo?.softDelete(id));
        if (ok) setGoals(goalsRepo!.list() as Goal[]);
        return ok;
      },
      createSavedLink: (data) => {
        const link = savedLinksRepo!.create({
          title: data.title,
          url: data.url,
          description: data.description || '',
          kind: data.kind || 'link',
          category: data.category || '',
          tags: data.tags || [],
          favorite: data.favorite || false,
          archived: false,
          projectId: data.projectId ?? null,
          mimeType: data.mimeType,
          storagePath: data.storagePath,
        }) as SavedLink;
        setSavedLinks(savedLinksRepo!.list() as SavedLink[]);
        return link;
      },
      updateSavedLink: (id, updates) => {
        const link = savedLinksRepo?.update(id, updates) as SavedLink | null;
        if (link) setSavedLinks(savedLinksRepo!.list() as SavedLink[]);
        return link;
      },
      deleteSavedLink: (id) => {
        const ok = Boolean(savedLinksRepo?.softDelete(id));
        if (ok) setSavedLinks(savedLinksRepo!.list() as SavedLink[]);
        return ok;
      },
      markNotificationRead: (id) => {
        notificationsRepo?.update(id, { read: true });
        setNotifications(notificationsRepo!.list() as AppNotification[]);
      },
      markAllNotificationsRead: () => {
        (notificationsRepo?.list() as AppNotification[]).forEach((item) => {
          if (!item.read) notificationsRepo?.update(item.id, { read: true });
        });
        setNotifications(notificationsRepo!.list() as AppNotification[]);
      },
      deleteNotification: (id) => {
        notificationsRepo?.softDelete(id);
        setNotifications(notificationsRepo!.list() as AppNotification[]);
      },
      createAiConversation: (title = 'Nova conversa') => {
        const conversation = aiConversationsRepo!.create({
          title,
          pinned: false,
        }) as AiConversation;
        setAiConversations(aiConversationsRepo!.list() as AiConversation[]);
        return conversation;
      },
      addAiMessage: (data) => {
        const message = aiMessagesRepo!.create({
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          status: data.status || 'completed',
          suggestedActions: data.suggestedActions || [],
          error: data.error,
        }) as AiMessage;
        setAiMessages(aiMessagesRepo!.list() as AiMessage[]);
        return message;
      },
      proposeToolExecution: (data) => {
        const execution = aiToolExecutionsRepo!.create({
          ...data,
          status: 'proposed',
        }) as AiToolExecution;
        setAiToolExecutions(aiToolExecutionsRepo!.list() as AiToolExecution[]);
        auditRepo?.create({
          action: 'ai.tool.proposed',
          entityType: 'ai_tool_execution',
          entityId: execution.id,
          metadata: { toolName: data.toolName },
          source: 'ai',
        });
        return execution;
      },
      confirmToolExecution: (id) => {
        const execution = aiToolExecutionsRepo?.update(id, { status: 'confirmed' }) as AiToolExecution | null;
        if (execution) setAiToolExecutions(aiToolExecutionsRepo!.list() as AiToolExecution[]);
        return execution;
      },
      rejectToolExecution: (id) => {
        const execution = aiToolExecutionsRepo?.update(id, { status: 'rejected' }) as AiToolExecution | null;
        if (execution) setAiToolExecutions(aiToolExecutionsRepo!.list() as AiToolExecution[]);
        return execution;
      },
      refreshNotifications,
      exportData: () =>
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            preferences,
            tasks,
            projects,
            notes,
            events,
            transactions,
            habits,
            goals,
            savedLinks,
          },
          null,
          2,
        ),
      clearAllData: () => {
        [
          tasksRepo,
          projectsRepo,
          notesRepo,
          eventsRepo,
          remindersRepo,
          transactionsRepo,
          habitsRepo,
          habitEntriesRepo,
          goalsRepo,
          savedLinksRepo,
          notificationsRepo,
          aiConversationsRepo,
          aiMessagesRepo,
          aiToolExecutionsRepo,
        ].forEach((repo) => repo?.clear());
        reload();
      },
    };
  }, [
    ready,
    preferences,
    tasks,
    projects,
    notes,
    events,
    reminders,
    transactions,
    accounts,
    categories,
    habits,
    habitEntries,
    goals,
    savedLinks,
    notifications,
    aiConversations,
    aiMessages,
    aiToolExecutions,
    userId,
    tasksRepo,
    projectsRepo,
    notesRepo,
    eventsRepo,
    remindersRepo,
    transactionsRepo,
    habitsRepo,
    habitEntriesRepo,
    goalsRepo,
    savedLinksRepo,
    notificationsRepo,
    aiConversationsRepo,
    aiMessagesRepo,
    aiToolExecutionsRepo,
    auditRepo,
    audit,
    refreshNotifications,
    reload,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function createQuickId() {
  return createId('tmp');
}
