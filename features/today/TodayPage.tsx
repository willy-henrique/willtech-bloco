import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { useToast } from '../../hooks/useToast';
import {
  greetingForHour,
  formatLongDate,
  isToday,
  addDays,
  startOfDay,
  formatTime,
} from '../../lib/dates';
import { isInboxTask, taskTitle } from '../../lib/domain';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { TaskItem } from '../../components/tasks/TaskItem';
import { Button } from '../../components/ui/Button';

interface OutletCtx {
  openCapture: () => void;
}

export const TodayPage: React.FC = () => {
  const { tasks, events, projects, isLoading, toggleTask, deleteTask, updateTask, addTask } =
    useApp();
  const { toast } = useToast();
  const { openCapture } = useOutletContext<OutletCtx>();

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name;

  const now = Date.now();
  const tomorrowStart = startOfDay(addDays(new Date(now), 1)).getTime();

  const { appointments, todayTasks, reminders, upcoming } = useMemo(() => {
    const openTasks = tasks.filter((t) => !t.isCompleted && !t.archived && !isInboxTask(t));
    const todayTasksList = openTasks.filter((t) => t.dueAt != null && isToday(t.dueAt));
    const appointmentsList = events.filter(
      (e) => !e.archived && e.kind === 'event' && isToday(e.scheduledAt)
    );
    const remindersList = events.filter(
      (e) => !e.archived && e.kind === 'reminder' && isToday(e.scheduledAt)
    );
    const upcomingList = [
      ...openTasks
        .filter((t) => t.dueAt != null && !isToday(t.dueAt) && t.dueAt > now)
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          title: taskTitle(t),
          when: t.dueAt!,
          kind: 'task' as const,
        })),
      ...events
        .filter((e) => !e.archived && e.scheduledAt > tomorrowStart)
        .slice(0, 5)
        .map((e) => ({
          id: e.id,
          title: e.title,
          when: e.scheduledAt,
          kind: e.kind,
        })),
    ]
      .sort((a, b) => a.when - b.when)
      .slice(0, 6);

    return {
      appointments: appointmentsList,
      todayTasks: todayTasksList,
      reminders: remindersList,
      upcoming: upcomingList,
    };
  }, [tasks, events, now, tomorrowStart]);

  const hasAnything = appointments.length + todayTasks.length + reminders.length > 0;

  return (
    <div>
      <div className="mb-6">
        <p className="font-display text-3xl tracking-tight">{greetingForHour()}</p>
        <p className="mt-1 capitalize text-[var(--muted)]">{formatLongDate()}</p>
      </div>

      <button
        type="button"
        onClick={openCapture}
        className="mb-8 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left shadow-sm transition hover:border-[var(--primary)]"
      >
        <p className="text-sm font-medium text-[var(--text)]">O que você precisa guardar?</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Toque para capturar em segundos</p>
      </button>

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <>
          <section className="mb-8">
            <SectionHeader title="Hoje" />
            {!hasAnything ? (
              <EmptyState
                title="Nada para hoje"
                description="Capture algo rápido ou aproveite o dia livre."
                action={
                  <Button variant="soft" onClick={openCapture}>
                    Capturar
                  </Button>
                }
              />
            ) : (
              <div className="space-y-6">
                {appointments.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      Compromissos
                    </p>
                    <ul className="space-y-2">
                      {appointments.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-baseline gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                        >
                          <span className="meta-text w-12 shrink-0">
                            {formatTime(e.scheduledAt)}
                          </span>
                          <span>{e.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {todayTasks.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Tarefas</p>
                    <div className="space-y-2">
                      {todayTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          projectName={projectName(task.projectId)}
                          onToggle={async (id) => {
                            await toggleTask(id);
                            toast('Tarefa concluída ✓', {
                              label: 'Desfazer',
                              onClick: () => void toggleTask(id),
                            });
                          }}
                          onDelete={async (id) => {
                            const snapshot = task;
                            await deleteTask(id);
                            toast('Item excluído', {
                              label: 'Desfazer',
                              onClick: () =>
                                void addTask(
                                  snapshot.projectId,
                                  snapshot.description,
                                  snapshot.priority,
                                  {
                                    title: snapshot.title,
                                    dueAt: snapshot.dueAt,
                                    inbox: snapshot.inbox,
                                    status: snapshot.status,
                                  }
                                ),
                            });
                          }}
                          onSnooze={async (id) => {
                            await updateTask(id, {
                              dueAt: startOfDay(addDays(new Date(), 1)).getTime() + 9 * 3600000,
                            });
                            toast('Adiado para amanhã');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {reminders.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
                      Lembretes
                    </p>
                    <ul className="space-y-2">
                      {reminders.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-baseline gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                        >
                          <span className="meta-text w-12 shrink-0">
                            {formatTime(e.scheduledAt)}
                          </span>
                          <span>{e.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {upcoming.length > 0 && (
            <section>
              <SectionHeader title="Próximos" />
              <ul className="space-y-2">
                {upcoming.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-center justify-between rounded-[var(--radius-md)] px-1 py-2"
                  >
                    <span className="text-[var(--text)]">{item.title}</span>
                    <span className="meta-text">
                      {new Date(item.when).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
};
