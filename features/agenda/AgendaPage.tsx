import React, { useMemo, useState } from 'react';
import { useApp } from '../../AppContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatShortDate, formatTime, isToday, isTomorrow, isThisWeek, startOfDay } from '../../lib/dates';
import { taskTitle } from '../../lib/domain';

type View = 'today' | 'tomorrow' | 'week' | 'month';

export const AgendaPage: React.FC = () => {
  const { tasks, events } = useApp();
  const [view, setView] = useState<View>('week');

  const entries = useMemo(() => {
    const taskEntries = tasks
      .filter((t) => !t.isCompleted && !t.archived && t.dueAt != null)
      .map((t) => ({
        id: t.id,
        title: taskTitle(t),
        when: t.dueAt!,
        kind: 'task' as const,
      }));
    const eventEntries = events
      .filter((e) => !e.archived)
      .map((e) => ({
        id: e.id,
        title: e.title,
        when: e.scheduledAt,
        kind: e.kind,
      }));
    const all = [...taskEntries, ...eventEntries].sort((a, b) => a.when - b.when);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    return all.filter((item) => {
      if (view === 'today') return isToday(item.when);
      if (view === 'tomorrow') return isTomorrow(item.when);
      if (view === 'week') return isThisWeek(item.when);
      return item.when >= monthStart && item.when <= monthEnd;
    });
  }, [tasks, events, view]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const item of entries) {
      const key = startOfDay(new Date(item.when)).toISOString();
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <div>
      <PageHeader title="Agenda" subtitle="Tarefas, eventos e lembretes" />
      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ['today', 'Hoje'],
            ['tomorrow', 'Amanhã'],
            ['week', 'Semana'],
            ['month', 'Mês'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`min-h-11 rounded-full px-4 text-sm ${
              view === id
                ? 'bg-[var(--primary)] text-white dark:text-[#0f1412]'
                : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {grouped.length === 0 ? (
        <EmptyState title="Agenda livre" description="Nada agendado neste período." />
      ) : (
        <div className="space-y-6">
          {grouped.map(([key, items]) => (
            <section key={key}>
              <h2 className="section-title mb-3">
                {formatShortDate(new Date(key).getTime())}
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-baseline gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                  >
                    <span className="meta-text w-14 shrink-0">{formatTime(item.when)}</span>
                    <div>
                      <p>{item.title}</p>
                      <p className="meta-text capitalize">{item.kind}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
