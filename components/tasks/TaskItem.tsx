import React, { useRef, useState } from 'react';
import { Check, MoreHorizontal, Trash2, Clock } from 'lucide-react';
import type { Task } from '../../types';
import { taskTitle } from '../../lib/domain';
import { formatShortDate, formatTime } from '../../lib/dates';

interface TaskItemProps {
  task: Task;
  projectName?: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSnooze?: (id: string) => void;
  onOpen?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  projectName,
  onToggle,
  onDelete,
  onSnooze,
  onOpen,
}) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef<number | null>(null);
  const title = taskTitle(task);
  const when = task.dueAt || task.scheduledAt || task.reminderAt;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.touches[0].clientX - startX.current;
    setOffset(Math.max(-96, Math.min(96, dx)));
  };

  const onTouchEnd = () => {
    if (offset > 64) onToggle(task.id);
    else if (offset < -64) onDelete(task.id);
    setOffset(0);
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-md)]">
      <div className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-[var(--success)] text-white">
        <Check size={18} aria-hidden />
      </div>
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-[var(--danger)] text-white">
        <Trash2 size={18} aria-hidden />
      </div>
      <div
        className="relative flex items-center gap-3 border border-[var(--border)] bg-[var(--surface)] px-3 py-3 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          aria-label={task.isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa'}
          onClick={() => onToggle(task.id)}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
            task.isCompleted
              ? 'border-[var(--success)] bg-[var(--primary-soft)] text-[var(--success)]'
              : 'border-[var(--border)] text-transparent'
          }`}
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen?.(task)}
        >
          <p
            className={`truncate text-[var(--text)] ${
              task.isCompleted ? 'line-through opacity-50' : ''
            }`}
          >
            {title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 meta-text">
            {when != null && <span>{formatShortDate(when)} · {formatTime(when)}</span>}
            {projectName && <span>{projectName}</span>}
            {task.priority && task.priority !== 'Normal' && <span>{task.priority}</span>}
          </div>
        </button>
        <div className="flex shrink-0 items-center">
          {onSnooze && (
            <button
              type="button"
              aria-label="Adiar"
              className="flex h-11 w-11 items-center justify-center text-[var(--muted)]"
              onClick={() => onSnooze(task.id)}
            >
              <Clock size={18} />
            </button>
          )}
          <button
            type="button"
            aria-label="Mais ações"
            className="flex h-11 w-11 items-center justify-center text-[var(--muted)]"
            onClick={() => onOpen?.(task)}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
