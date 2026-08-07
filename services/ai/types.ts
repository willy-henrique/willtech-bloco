/**
 * Future AI assistant architecture (stubs only).
 * Designed for RAG, tool calling, structured output, and semantic search.
 */

import type { Item } from '../../types/item';

export interface AssistantContext {
  items: Item[];
  query: string;
  projectId?: string | null;
}

export interface AssistantToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AssistantResponse {
  message: string;
  toolCalls?: AssistantToolCall[];
  structured?: Record<string, unknown>;
}

export interface AssistantPort {
  ask(context: AssistantContext): Promise<AssistantResponse>;
  retrieveContext(query: string): Promise<Item[]>;
}

export const ASSISTANT_TOOLS = [
  {
    name: 'list_tasks_for_date',
    description: 'List tasks due on a given date',
    parameters: { date: 'ISO date string' },
  },
  {
    name: 'create_task',
    description: 'Create a task from natural language',
    parameters: { title: 'string', dueAt: 'optional timestamp', projectId: 'optional' },
  },
  {
    name: 'search_items',
    description: 'Search notes, tasks, events by keyword',
    parameters: { query: 'string' },
  },
  {
    name: 'summarize_notes',
    description: 'Summarize notes in a time range',
    parameters: { from: 'timestamp', to: 'timestamp' },
  },
] as const;
