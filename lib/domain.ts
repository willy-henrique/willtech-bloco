import { Task, TaskPriority, Project } from '../types';
import { CalendarEvent, Item, ItemStatus, Note } from '../types/item';

export const INBOX_PROJECT_ID = 'inbox';

export function taskTitle(task: Task): string {
  return (task.title || task.description || '').trim();
}

export function isInboxTask(task: Task): boolean {
  if (task.archived) return false;
  if (task.status === 'inbox' || task.inbox === true) return true;
  if (task.projectId === INBOX_PROJECT_ID || task.projectId === 'Geral') {
    return !task.dueAt && !task.scheduledAt;
  }
  return false;
}

export function taskStatus(task: Task): ItemStatus {
  if (task.archived || task.status === 'archived') return 'archived';
  if (task.isCompleted || task.status === 'completed') return 'completed';
  if (isInboxTask(task)) return 'inbox';
  return 'active';
}

export function taskToItem(task: Task): Item {
  return {
    id: task.id,
    type: 'task',
    title: taskTitle(task),
    content: task.description,
    status: taskStatus(task),
    scheduledAt: task.scheduledAt ?? null,
    dueAt: task.dueAt ?? null,
    reminderAt: task.reminderAt ?? null,
    projectId: task.projectId === INBOX_PROJECT_ID ? null : task.projectId,
    priority: task.priority,
    isCompleted: task.isCompleted,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function noteToItem(note: Note): Item {
  return {
    id: note.id,
    type: 'note',
    title: note.title || 'Sem título',
    content: note.content,
    status: note.archived ? 'archived' : 'active',
    projectId: note.projectId ?? null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function eventToItem(event: CalendarEvent): Item {
  return {
    id: event.id,
    type: event.kind === 'reminder' ? 'reminder' : 'event',
    title: event.title,
    content: event.content,
    status: event.archived ? 'archived' : 'active',
    scheduledAt: event.scheduledAt,
    dueAt: event.scheduledAt,
    reminderAt: event.kind === 'reminder' ? event.scheduledAt : null,
    projectId: event.projectId ?? null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export function projectToItem(project: Project): Item {
  return {
    id: project.id,
    type: 'idea',
    title: project.name,
    content: project.description || project.type,
    status: project.status === 'Legacy' ? 'archived' : 'active',
    projectId: project.id,
    createdAt: project.createdAt ?? Date.now(),
    metadata: { source: 'project', color: project.color, projectStatus: project.status },
  };
}

export function buildItems(params: {
  tasks: Task[];
  notes: Note[];
  events: CalendarEvent[];
  projects?: Project[];
}): Item[] {
  const items: Item[] = [
    ...params.tasks.filter((t) => !t.archived).map(taskToItem),
    ...params.notes.filter((n) => !n.archived).map(noteToItem),
    ...params.events.filter((e) => !e.archived).map(eventToItem),
  ];
  if (params.projects) {
    items.push(...params.projects.map(projectToItem));
  }
  return items.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
}

export interface CaptureOptions {
  text: string;
  dueAt?: number | null;
  reminderAt?: number | null;
  projectId?: string | null;
  asNote?: boolean;
  asEvent?: boolean;
  asReminder?: boolean;
}

export function parseCaptureIntent(text: string): {
  title: string;
  dueHint?: 'today' | 'tomorrow';
} {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  let dueHint: 'today' | 'tomorrow' | undefined;
  const title = trimmed;

  if (/(^|\s)amanh[aã](\s|$|[.,!?])/i.test(lower) || lower.includes('amanha')) {
    dueHint = 'tomorrow';
  } else if (/(^|\s)hoje(\s|$|[.,!?])/i.test(lower)) {
    dueHint = 'today';
  }

  return { title, dueHint };
}

export function defaultTaskPriority(): TaskPriority {
  return TaskPriority.NORMAL;
}
