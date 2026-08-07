import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, FileText, FolderKanban, Inbox, Search, Settings, Sun } from 'lucide-react';

const links = [
  { to: '/', label: 'Hoje', icon: Sun, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/notas', label: 'Notas', icon: FileText },
  { to: '/tudo', label: 'Tudo', icon: Search },
];

export const Sidebar: React.FC = () => (
  <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/80 px-3 py-6 backdrop-blur lg:flex">
    <div className="mb-8 px-3">
      <p className="font-display text-xl tracking-tight text-[var(--text)]">Will</p>
      <p className="meta-text mt-0.5">Assistente pessoal</p>
    </div>
    <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium ${
              isActive
                ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`
          }
        >
          <Icon size={18} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
    <NavLink
      to="/configuracoes"
      className={({ isActive }) =>
        `mt-auto flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm ${
          isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
        }`
      }
    >
      <Settings size={18} aria-hidden />
      Configurações
    </NavLink>
  </aside>
);
