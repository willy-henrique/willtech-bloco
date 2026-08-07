import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, FolderKanban, Target } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDate, formatTime, isOverdue, toDateKey } from '../../lib/dates';
import { projectProgress, goalProgress } from '../../lib/progress';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PRIORITY_LABELS } from '../../constants/defaults';
import { QuickCapture } from './QuickCapture';

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  tone?: 'default' | 'danger' | 'accent' | 'warning';
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          tone === 'danger'
            ? 'text-danger'
            : tone === 'accent'
              ? 'text-accent'
              : tone === 'warning'
                ? 'text-warning'
                : 'text-text'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { tasks, events, projects, goals, reminders, notes, toggleTaskDone } = useData();
  const today = toDateKey();

  const summary = useMemo(() => {
    const pending = tasks.filter((task) => task.status !== 'done' && task.status !== 'archived');
    const todayTasks = pending.filter((task) => task.date === today || task.dueDate === today);
    const overdue = pending.filter((task) => isOverdue(task.dueDate || task.date, false));
    const todayEvents = events
      .filter((event) => event.date === today)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    const nextEvent = todayEvents[0] || events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    const activeProjects = projects.filter((project) => project.status === 'active');
    const activeGoals = goals.filter((goal) => goal.status === 'active');
    const openReminders = reminders.filter((item) => !item.completed);

    return { pending, todayTasks, overdue, todayEvents, nextEvent, activeProjects, activeGoals, openReminders };
  }, [tasks, events, projects, goals, reminders, today]);

  const priorityTasks = summary.pending
    .slice()
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 6);

  return (
    <div className="space-y-6 px-4 py-4 md:px-6">
      <QuickCapture />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <Stat label="Pendentes" value={summary.pending.length} />
        <Stat label="Para hoje" value={summary.todayTasks.length} tone="accent" />
        <Stat label="Atrasadas" value={summary.overdue.length} tone="danger" />
        <Stat label="Compromissos" value={summary.todayEvents.length} />
        <Stat label="Lembretes" value={summary.openReminders.length} tone="warning" />
        <Stat label="Metas" value={summary.activeGoals.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Agenda de hoje</h2>
              <p className="text-sm text-text-muted">Linha do tempo do seu dia</p>
            </div>
            <Link
              to="/agenda"
              className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-border bg-surface-hover px-3 text-sm font-semibold"
            >
              Ver agenda
            </Link>
          </div>
          {summary.todayEvents.length === 0 ? (
            <EmptyState
              title="Nenhum compromisso hoje"
              description="Seu dia está livre. Crie um evento quando precisar."
              actionLabel="Abrir agenda"
              onAction={() => {
                window.location.href = '/agenda';
              }}
              icon={<CalendarDays className="h-6 w-6" />}
            />
          ) : (
            <ol className="space-y-3">
              {summary.todayEvents.map((event) => (
                <li key={event.id} className="flex gap-3 border-l-2 border-accent pl-3">
                  <div className="w-16 shrink-0 text-xs font-semibold text-text-subtle">
                    {event.allDay || !event.startTime ? 'Dia todo' : event.startTime}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-text-muted">
                      {event.category}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {summary.nextEvent ? (
            <p className="mt-4 text-sm text-text-muted">
              Próximo compromisso: <span className="font-semibold text-text">{summary.nextEvent.title}</span>
              {' · '}
              {formatDate(summary.nextEvent.date)}
              {summary.nextEvent.startTime ? ` · ${summary.nextEvent.startTime}` : ''}
            </p>
          ) : null}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Tarefas prioritárias</h2>
              <p className="text-sm text-text-muted">O que precisa da sua atenção</p>
            </div>
            <Link to="/tarefas" className="text-sm font-semibold text-accent">
              Ver todas
            </Link>
          </div>
          {priorityTasks.length === 0 ? (
            <EmptyState
              title="Nada pendente"
              description="Todas as tarefas estão em dia."
              icon={<CheckCircle2 className="h-6 w-6" />}
            />
          ) : (
            <ul className="space-y-2">
              {priorityTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border px-3 py-3"
                >
                  <button
                    type="button"
                    className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border hover:border-accent"
                    aria-label={`Concluir ${task.title}`}
                    onClick={() => toggleTaskDone(task.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{task.title}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge tone={task.priority === 'critical' || task.priority === 'high' ? 'danger' : 'default'}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                      {isOverdue(task.dueDate || task.date) ? <Badge tone="danger">Atrasada</Badge> : null}
                      {task.dueDate ? (
                        <span className="text-xs text-text-subtle">{formatDate(task.dueDate)}</span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Projetos ativos</h2>
              <p className="text-sm text-text-muted">Progresso calculado pelas tarefas</p>
            </div>
            <FolderKanban className="h-5 w-5 text-text-subtle" aria-hidden />
          </div>
          {summary.activeProjects.length === 0 ? (
            <EmptyState title="Sem projetos" description="Crie um projeto para organizar entregas." />
          ) : (
            <ul className="space-y-3">
              {summary.activeProjects.slice(0, 5).map((project) => {
                const projectTasks = tasks.filter((task) => task.projectId === project.id);
                const progress = projectProgress(projectTasks);
                const pendingCount = projectTasks.filter((task) => task.status !== 'done').length;
                const risk = project.dueDate && project.dueDate < today && pendingCount > 0;
                return (
                  <li key={project.id}>
                    <Link
                      to={`/projetos/${project.id}`}
                      className="block rounded-[var(--radius-md)] border border-border px-3 py-3 hover:bg-surface-hover"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: project.color }}
                            aria-hidden
                          />
                          <p className="font-medium">{project.name}</p>
                        </div>
                        {risk ? (
                          <Badge tone="danger">
                            <AlertCircle className="h-3 w-3" /> Risco
                          </Badge>
                        ) : (
                          <span className="text-xs text-text-subtle">{pendingCount} pendentes</span>
                        )}
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-text-subtle">{progress}% concluído</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Metas em andamento</h2>
              <p className="text-sm text-text-muted">Acompanhe progresso sem culpa</p>
            </div>
            <Target className="h-5 w-5 text-text-subtle" aria-hidden />
          </div>
          {summary.activeGoals.length === 0 ? (
            <EmptyState title="Nenhuma meta ativa" description="Defina uma meta pessoal ou profissional." />
          ) : (
            <ul className="space-y-3">
              {summary.activeGoals.slice(0, 5).map((goal) => {
                const progress = goalProgress(goal.currentValue, goal.targetValue);
                return (
                  <li key={goal.id} className="rounded-[var(--radius-md)] border border-border px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{goal.title}</p>
                      <span className="text-xs text-text-subtle">{progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-muted">
                      <div className="h-full rounded-full bg-info" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-text-subtle">
                      {goal.currentValue}/{goal.targetValue} {goal.unit}
                      {goal.dueDate ? ` · até ${formatDate(goal.dueDate)}` : ''}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4 md:p-5">
        <h2 className="text-base font-semibold">Atividade recente</h2>
        <p className="mb-4 text-sm text-text-muted">Últimas atualizações nos seus módulos</p>
        <ul className="space-y-2">
          {[
            ...tasks.filter((task) => task.completedAt).map((task) => ({
              id: `done-${task.id}`,
              label: `Tarefa concluída: ${task.title}`,
              at: task.completedAt || task.updatedAt,
            })),
            ...notes.map((note) => ({
              id: `note-${note.id}`,
              label: `Nota atualizada: ${note.title}`,
              at: note.updatedAt,
            })),
            ...projects.map((project) => ({
              id: `project-${project.id}`,
              label: `Projeto atualizado: ${project.name}`,
              at: project.updatedAt,
            })),
          ]
            .sort((a, b) => b.at - a.at)
            .slice(0, 8)
            .map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-border/70 py-2 text-sm last:border-0">
                <span>{item.label}</span>
                <span className="shrink-0 text-xs text-text-subtle">
                  {formatDate(item.at)} {formatTime(item.at)}
                </span>
              </li>
            ))}
          {tasks.length + notes.length + projects.length === 0 ? (
            <li className="text-sm text-text-muted">Comece criando uma tarefa, nota ou projeto.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
