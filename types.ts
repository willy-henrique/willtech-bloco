
export enum ProjectId {
  NATURIZE = 'Naturize',
  AUGE = 'Auge',
  SUPERMERCADO = 'Supermercado',
  DETRAN = 'Detran-GO'
}

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
  id: ProjectId;
  name: string;
  type: string;
  status: 'Active' | 'Maintenance' | 'Legacy';
  progress: number;
  color: string;
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
