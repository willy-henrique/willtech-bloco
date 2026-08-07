// ProjectId agora é uma string para permitir projetos dinâmicos
export type ProjectId = string;

export enum TaskPriority {
  CRITICAL = 'Critical',
  URGENT = 'Urgent',
  NORMAL = 'Normal',
  LOW = 'Low'
}

export type VaultCategory = 'Login' | 'API Key' | '.env' | 'Outros';

export interface VaultItem {
  id: string;
  title: string;
  content: string;
  category: VaultCategory;
  createdAt: number;
}

/** Task with optional personal-assistant fields (backward compatible). */
export interface Task {
  id: string;
  projectId: ProjectId;
  description: string;
  priority: TaskPriority;
  isCompleted: boolean;
  createdAt: number;
  /** Optional display title; falls back to description */
  title?: string;
  /** When true (or status === 'inbox'), item lives in Inbox */
  inbox?: boolean;
  status?: 'inbox' | 'active' | 'completed' | 'archived';
  dueAt?: number | null;
  reminderAt?: number | null;
  scheduledAt?: number | null;
  updatedAt?: number;
  archived?: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Maintenance' | 'Legacy';
  progress: number;
  color: string;
  createdAt?: number;
  stack?: string;
  description?: string;
}

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description?: string;
}

export interface ContractDeadline {
  id: string;
  title: string;
  date: string;
  projectId: ProjectId;
  type: 'Contract' | 'Sprint' | 'Payment';
}

export interface ProjectCredential {
  id: string;
  projectId: string;
  title: string;
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  env?: string;
  notes?: string;
  createdAt: number;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  amount?: number;
  currency?: string;
  status: 'pending' | 'paid' | 'overdue';
  isRecurring?: boolean;
  recurringDay?: number;
  notes?: string;
  createdAt: number;
  paidAt?: number;
}

export interface ProjectNote {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ProjectDetail {
  projectId: string;
  description?: string;
  clientName?: string;
  clientContact?: string;
  repositoryUrl?: string;
  productionUrl?: string;
  stagingUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

export type FinanceTransactionType = 'income' | 'expense';
export type FinanceTransactionStatus = 'pending' | 'paid' | 'overdue' | 'received';
export type FinanceCategory =
  | 'Aluguel'
  | 'Energia'
  | 'Mercado'
  | 'SaaS Subscriptions'
  | 'Receitas de Projetos'
  | 'Hardware'
  | 'Software'
  | 'Outros';

export interface FinanceTransaction {
  id: string;
  description: string;
  category: FinanceCategory;
  dueDate: string;
  amount: number;
  currency: string;
  type: FinanceTransactionType;
  status: FinanceTransactionStatus;
  context: 'pessoal' | 'business';
  createdAt: number;
  paidAt?: number;
}

export interface FinanceGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: string;
  createdAt: number;
}

export interface CashFlowPoint {
  month: string;
  inflows: number;
  outflows: number;
}

export type { Item, ItemType, ItemStatus, Note, CalendarEvent, CalendarEventKind } from './types/item';
