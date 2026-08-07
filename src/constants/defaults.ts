import type {
  FinancialAccount,
  FinancialCategory,
  UserPreferences,
} from '../types';
import { TIMEZONE } from '../lib/dates';

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId' | 'updatedAt'> = {
  theme: 'system',
  density: 'comfortable',
  reduceMotion: false,
  weekStartsOn: 1,
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  currency: 'BRL',
  homePage: '/',
  notificationsEnabled: true,
  sidebarCollapsed: false,
};

export const DEFAULT_CATEGORIES: Omit<
  FinancialCategory,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>[] = [
  { name: 'Salário', type: 'income', color: '#0f9f6e' },
  { name: 'Projetos', type: 'income', color: '#0284c7' },
  { name: 'Moradia', type: 'expense', color: '#dc2626' },
  { name: 'Alimentação', type: 'expense', color: '#d97706' },
  { name: 'Transporte', type: 'expense', color: '#7c3aed' },
  { name: 'Assinaturas', type: 'expense', color: '#0891b2' },
  { name: 'Estudos', type: 'expense', color: '#2563eb' },
  { name: 'Outros', type: 'both', color: '#64748b' },
];

export const DEFAULT_ACCOUNTS: Omit<
  FinancialAccount,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'
>[] = [
  { name: 'Conta principal', type: 'checking', balance: 0, currency: 'BRL', color: '#3fcf8e' },
  { name: 'Dinheiro', type: 'cash', balance: 0, currency: 'BRL', color: '#f59e0b' },
];

export const APP_NAME = 'Will Tech';
export const APP_TAGLINE = 'Central pessoal de comando';
export const DEFAULT_TIMEZONE = TIMEZONE;

export const PRIORITY_LABELS = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
} as const;

export const STATUS_LABELS = {
  todo: 'A fazer',
  in_progress: 'Em progresso',
  done: 'Concluída',
  archived: 'Arquivada',
} as const;

export const EVENT_CATEGORY_LABELS = {
  work: 'Trabalho',
  personal: 'Pessoal',
  study: 'Estudos',
  health: 'Saúde',
  finance: 'Finanças',
  other: 'Outros',
} as const;

export const EVENT_CATEGORY_COLORS = {
  work: '#0284c7',
  personal: '#0f9f6e',
  study: '#7c3aed',
  health: '#dc2626',
  finance: '#d97706',
  other: '#64748b',
} as const;
