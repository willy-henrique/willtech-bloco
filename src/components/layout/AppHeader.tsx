import { Bell, Command, Plus, Search } from 'lucide-react';
import { formatDate, greetingForHour } from '../../lib/dates';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onSearch: () => void;
  onCreate: () => void;
  onNotifications: () => void;
}

export function AppHeader({
  title,
  subtitle,
  onSearch,
  onCreate,
  onNotifications,
}: AppHeaderProps) {
  const { user } = useAuth();
  const { notifications } = useData();
  const unread = notifications.filter((item) => !item.read).length;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-md safe-pt">
      <div className="flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-text-subtle">
              {formatDate(new Date(), { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
              {title || `${greetingForHour()}, ${user?.displayName?.split(' ')[0] || 'Willy'}`}
            </h1>
            {subtitle ? <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={onSearch} aria-label="Buscar (Ctrl K)">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNotifications} aria-label="Notificações" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" aria-label={`${unread} não lidas`} />
              ) : null}
            </Button>
            <Button className="hidden sm:inline-flex" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Criar
            </Button>
            <Avatar name={user?.displayName || 'Usuário'} src={user?.photoURL} className="hidden md:inline-flex" />
          </div>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="flex h-11 w-full items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-left text-sm text-text-subtle transition hover:border-border-strong"
        >
          <Command className="h-4 w-4" aria-hidden />
          <span className="flex-1">Buscar ou executar comando…</span>
          <Badge>⌘K</Badge>
        </button>
      </div>
    </header>
  );
}
