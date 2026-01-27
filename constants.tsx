
import React from 'react';
import { Project, ContractDeadline, Snippet } from './types';

export const INITIAL_PROJECTS: Omit<Project, 'id' | 'createdAt'>[] = [
  {
    name: 'Naturize',
    type: 'ERP/SaaS',
    status: 'Active',
    progress: 75,
    color: '#3fcf8e', // WillTech Green
    stack: 'React/Node'
  },
  {
    name: 'Auge',
    type: 'Business Intelligence',
    status: 'Active',
    progress: 40,
    color: '#00d1ff', // BI Blue
    stack: 'React/Node'
  },
  {
    name: 'Supermercado',
    type: 'Legado / PHP',
    status: 'Maintenance',
    progress: 95,
    color: '#ff9f00', // Warning Orange
    stack: 'PHP/SQL'
  },
  {
    name: 'Detran-GO',
    type: 'EdTech',
    status: 'Active',
    progress: 20,
    color: '#ff4d4d', // Critical Red
    stack: 'React/Node'
  }
];

export const INITIAL_DEADLINES: ContractDeadline[] = [
  {
    id: '1',
    title: 'Aviso Prévio (30 dias)',
    date: '2024-06-15',
    projectId: 'Naturize',
    type: 'Contract'
  },
  {
    id: '2',
    title: 'Sprint Delivery 14',
    date: '2024-05-30',
    projectId: 'Auge',
    type: 'Sprint'
  }
];

export const INITIAL_SNIPPETS: Snippet[] = [
  {
    id: 's1',
    title: 'Auge BI - Monthly Revenue',
    language: 'sql',
    code: `SELECT \n  date_trunc('month', created_at) AS month, \n  SUM(amount) \nFROM transactions \nWHERE status = 'completed' \nGROUP BY 1 \nORDER BY 1 DESC;`,
    description: 'Calculates the total revenue grouped by month for the Auge system.'
  },
  {
    id: 's2',
    title: 'Naturize - User Export',
    language: 'sql',
    code: `SELECT name, email, plan_type \nFROM users \nWHERE active = true \nAND last_login > now() - interval '30 days';`,
    description: 'Fetch active users from Naturize SaaS for marketing reporting.'
  }
];
