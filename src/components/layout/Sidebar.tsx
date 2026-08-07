import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';
import { APP_NAME } from '../../constants/defaults';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { cn } from '../../lib/cn';
import { Avatar } from '../ui/Avatar';
import { Tooltip } from '../ui/Tooltip';
import { Button } from '../ui/Button';

const groups = [
  { id: 'principal', label: 'Principal' },
  { id: 'vida', label: 'Vida' },
  { id: 'sistema', label: 'Sistema' },
] as const;

export function Sidebar() {
  const { user, logout } = useAuth();
  const { preferences, updatePreferences } = useData();
  const collapsed = preferences.sidebarCollapsed;

  return (
    <aside
      className={cn(
        'hidden lg:flex h-dvh sticky top-0 flex-col border-r border-border bg-bg-elevated/90 backdrop-blur-md transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      )}
    >
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent text-accent-fg font-black">
          W
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">{APP_NAME}</p>
            <p className="truncate text-xs text-text-subtle">Central pessoal</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 custom-scrollbar" aria-label="Navegação principal">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group.id);
          return (
            <div key={group.id} className="mb-4">
              {!collapsed ? (
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-subtle">
                  {group.label}
                </p>
              ) : null}
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const link = (
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition duration-200 touch-target',
                          isActive
                            ? 'bg-accent-soft text-accent'
                            : 'text-text-muted hover:bg-surface-hover hover:text-text',
                          collapsed && 'justify-center px-0',
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
                    </NavLink>
                  );

                  return (
                    <li key={item.to}>
                      {collapsed ? <Tooltip label={item.label}>{link}</Tooltip> : link}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'md'}
          className={cn('w-full', !collapsed && 'justify-start')}
          onClick={() => updatePreferences({ sidebarCollapsed: !collapsed })}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed ? 'Recolher' : null}
        </Button>

        <div className={cn('flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2', collapsed && 'justify-center')}>
          <Avatar name={user?.displayName || 'Usuário'} src={user?.photoURL} />
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.displayName}</p>
              <p className="truncate text-xs text-text-subtle">{user?.email}</p>
            </div>
          ) : null}
          <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
