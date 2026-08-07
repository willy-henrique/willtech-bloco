/** Unified app-level Item model for search, Today, Inbox, and future AI. */
export type ItemType = 'note' | 'task' | 'event' | 'reminder' | 'link' | 'idea';

export type ItemStatus =
  | 'inbox'
  | 'active'
  | 'completed'
  | 'archived'
  | 'cancelled';

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  content?: string;
  status: ItemStatus;
  scheduledAt?: number | null;
  dueAt?: number | null;
  reminderAt?: number | null;
  projectId?: string | null;
  priority?: string | null;
  isCompleted?: boolean;
  createdAt: number;
  updatedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  projectId?: string | null;
  archived?: boolean;
  createdAt: number;
  updatedAt?: number;
}

export type CalendarEventKind = 'event' | 'reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  content?: string;
  kind: CalendarEventKind;
  scheduledAt: number;
  projectId?: string | null;
  archived?: boolean;
  createdAt: number;
  updatedAt?: number;
}
