import React from 'react';
import { NavLink } from 'react-router-dom';
import { CalendarDays, Inbox, Plus, Search, Sun } from 'lucide-react';

interface BottomNavigationProps {
  onCapture: () => void;
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
    isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)]'
  }`;

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ onCapture }) => (
  <nav
    className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden"
    aria-label="Navegação mobile"
  >
    <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
      <NavLink to="/" end className={itemClass}>
        <Sun size={20} aria-hidden />
        Hoje
      </NavLink>
      <NavLink to="/agenda" className={itemClass}>
        <CalendarDays size={20} aria-hidden />
        Agenda
      </NavLink>
      <div className="flex justify-center">
        <button
          type="button"
          aria-label="Captura rápida"
          onClick={onCapture}
          className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg dark:text-[#0f1412]"
        >
          <Plus size={26} aria-hidden />
        </button>
      </div>
      <NavLink to="/inbox" className={itemClass}>
        <Inbox size={20} aria-hidden />
        Inbox
      </NavLink>
      <NavLink to="/tudo" className={itemClass}>
        <Search size={20} aria-hidden />
        Tudo
      </NavLink>
    </div>
  </nav>
);
