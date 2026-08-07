import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../lib/dates';
import type { NotificationType } from '../../types';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const FILTERS: { value: 'all' | NotificationType; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'task_overdue', label: 'Tarefas' },
  { value: 'event_upcoming', label: 'Agenda' },
  { value: 'goal_deadline', label: 'Metas' },
  { value: 'reminder', label: 'Lembretes' },
  { value: 'system', label: 'Sistema' },
];

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useData();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  const items = useMemo(
    () =>
      notifications
        .filter((item) => (filter === 'all' ? true : item.type === filter))
        .sort((a, b) => b.createdAt - a.createdAt),
    [notifications, filter],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notificações"
      description="Pendências e avisos gerados a partir dos seus dados."
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="ghost" onClick={markAllNotificationsRead}>
            Marcar todas como lidas
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
              filter === item.value
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border text-text-muted'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma notificação"
          description="Quando houver tarefas atrasadas, compromissos ou metas próximas, eles aparecem aqui."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--radius-md)] border border-border bg-bg px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    {!item.read ? <Badge tone="accent">Nova</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{item.body}</p>
                  <p className="mt-1 text-xs text-text-subtle">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    markNotificationRead(item.id);
                    if (item.href) {
                      onClose();
                      navigate(item.href);
                    }
                  }}
                >
                  Abrir
                </Button>
                {!item.read ? (
                  <Button size="sm" variant="ghost" onClick={() => markNotificationRead(item.id)}>
                    Marcar lida
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => deleteNotification(item.id)}>
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
