export type ThemePreference = 'light' | 'dark' | 'system';
export type DensityPreference = 'comfortable' | 'compact';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type EventCategory = 'work' | 'personal' | 'study' | 'health' | 'finance' | 'other';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type HabitFrequency = 'daily' | 'weekly';
export type NotificationType =
  | 'task_overdue'
  | 'event_upcoming'
  | 'reminder'
  | 'goal_deadline'
  | 'system';
export type FileKind = 'link' | 'document' | 'image' | 'reference';

export interface BaseEntity {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  timezone: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  userId: string;
  theme: ThemePreference;
  density: DensityPreference;
  reduceMotion: boolean;
  weekStartsOn: 0 | 1;
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  timeFormat: '24h' | '12h';
  currency: 'BRL';
  homePage: string;
  notificationsEnabled: boolean;
  sidebarCollapsed: boolean;
  updatedAt: number;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  date?: string | null;
  time?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
  category?: string;
  tags: string[];
  subtasks: TaskSubtask[];
  checklist: TaskChecklistItem[];
  notes?: string;
  reminderAt?: number | null;
  recurrence?: string | null;
  attachments: string[];
  completedAt?: number | null;
}

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  objective?: string;
  links: { id: string; title: string; url: string }[];
}

export interface Note extends BaseEntity {
  title: string;
  content: string;
  category?: string;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  projectId?: string | null;
  relatedLinks: string[];
}

export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  category: EventCategory;
  location?: string;
  meetingUrl?: string;
  reminderAt?: number | null;
  recurrence?: string | null;
  participants: string[];
  relatedTaskId?: string | null;
  notes?: string;
}

export interface Reminder extends BaseEntity {
  title: string;
  dueAt: number;
  relatedType?: 'task' | 'event' | 'goal' | 'habit' | 'note';
  relatedId?: string | null;
  completed: boolean;
}

export interface FinancialAccount extends BaseEntity {
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'credit' | 'investment';
  balance: number;
  currency: 'BRL';
  color: string;
}

export interface FinancialCategory extends BaseEntity {
  name: string;
  type: TransactionType | 'both';
  color: string;
  icon?: string;
}

export interface Transaction extends BaseEntity {
  description: string;
  type: TransactionType;
  amount: number;
  currency: 'BRL';
  categoryId?: string | null;
  accountId?: string | null;
  toAccountId?: string | null;
  paymentMethod?: string;
  dueDate: string;
  paidAt?: number | null;
  status: TransactionStatus;
  notes?: string;
  recurring: boolean;
  recurrenceRule?: string | null;
  projectId?: string | null;
}

export interface Habit extends BaseEntity {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  weekDays?: number[];
  color: string;
  archived: boolean;
  currentStreak: number;
  bestStreak: number;
  notes?: string;
}

export interface HabitEntry extends BaseEntity {
  habitId: string;
  date: string;
  completed: boolean;
  note?: string;
}

export interface Goal extends BaseEntity {
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate?: string | null;
  status: 'active' | 'completed' | 'paused';
  color: string;
}

export interface SavedLink extends BaseEntity {
  title: string;
  url: string;
  description?: string;
  kind: FileKind;
  category?: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  projectId?: string | null;
  mimeType?: string;
  storagePath?: string;
}

export interface AppNotification extends BaseEntity {
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  href?: string;
  relatedId?: string | null;
}

export interface AiConversation extends BaseEntity {
  title: string;
  pinned: boolean;
}

export interface AiMessage extends BaseEntity {
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  status: 'pending' | 'streaming' | 'completed' | 'error';
  suggestedActions?: AiSuggestedAction[];
  error?: string;
}

export interface AiSuggestedAction {
  id: string;
  label: string;
  toolName: string;
  params: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface AiToolExecution extends BaseEntity {
  conversationId: string;
  messageId?: string;
  toolName: string;
  params: Record<string, unknown>;
  status: 'proposed' | 'confirmed' | 'executed' | 'rejected' | 'failed';
  result?: unknown;
  error?: string;
}

export interface AuditLog extends BaseEntity {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  source: 'user' | 'system' | 'ai';
}

export type CollectionName =
  | 'tasks'
  | 'projects'
  | 'notes'
  | 'events'
  | 'reminders'
  | 'transactions'
  | 'accounts'
  | 'categories'
  | 'habits'
  | 'habitEntries'
  | 'goals'
  | 'savedLinks'
  | 'notifications'
  | 'aiConversations'
  | 'aiMessages'
  | 'aiToolExecutions'
  | 'auditLogs'
  | 'preferences';
