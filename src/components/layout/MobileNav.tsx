import { NavLink } from 'react-router-dom';
import { MoreHorizontal, Plus } from 'lucide-react';
import { MOBILE_PRIMARY } from '../../constants/navigation';
import { cn } from '../../lib/cn';

interface MobileNavProps {
  onCreate: () => void;
  onMore: () => void;
}

export function MobileNav({ onCreate, onMore }: MobileNavProps) {
  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-elevated/95 backdrop-blur-md safe-pb"
      aria-label="Navegação inferior"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pt-1">
        {MOBILE_PRIMARY.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium touch-target',
                  isActive ? 'text-accent' : 'text-text-subtle',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={onCreate}
          className="-mt-5 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-md"
          aria-label="Criar novo"
        >
          <Plus className="h-6 w-6" />
        </button>

        {MOBILE_PRIMARY.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium touch-target',
                  isActive ? 'text-accent' : 'text-text-subtle',
                )
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-text-subtle touch-target"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
          <span>Mais</span>
        </button>
      </div>
    </nav>
  );
}
