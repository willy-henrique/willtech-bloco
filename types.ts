
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

export interface Task {
  id: string;
  projectId: ProjectId;
  description: string;
  priority: TaskPriority;
  isCompleted: boolean;
  createdAt: number;
}

export interface Project {
  id: string; // ID único do projeto
  name: string;
  type: string;
  status: 'Active' | 'Maintenance' | 'Legacy';
  progress: number;
  color: string;
  createdAt?: number;
  stack?: string; // Stack tecnológico (ex: "React/Node", "PHP/SQL")
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

// Detalhes do Projeto - Bloco de Notas
export interface ProjectCredential {
  id: string;
  projectId: string;
  title: string;
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  env?: string; // Conteúdo do arquivo .env
  notes?: string;
  createdAt: number;
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  amount?: number;
  currency?: string;
  status: 'pending' | 'paid' | 'overdue';
  isRecurring?: boolean; // Se é recorrente (mensal)
  recurringDay?: number; // Dia do mês (ex: 4 para dia 04)
  notes?: string;
  createdAt: number;
  paidAt?: number; // Data em que foi marcado como pago
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
