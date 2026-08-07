import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AppHeader } from './AppHeader';
import { BottomSheet } from '../ui/BottomSheet';
import { QuickCreate } from '../../features/command-palette/QuickCreate';
import { NotificationsPanel } from '../../features/notifications/NotificationsPanel';
import { useData } from '../../contexts/DataContext';
import { PageSkeleton } from '../ui/Skeleton';

function openCommandPalette() {
  window.dispatchEvent(new CustomEvent('willtech:open-command'));
}

export function AppShell() {
  const navigate = useNavigate();
  const { ready } = useData();
  const [createOpen, setCreateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="app-height flex bg-bg text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          onSearch={openCommandPalette}
          onCreate={() => setCreateOpen(true)}
          onNotifications={() => setNotificationsOpen(true)}
        />
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-6 custom-scrollbar">
          {ready ? (
            <Outlet context={{ openCreate: () => setCreateOpen(true), openCommand: openCommandPalette }} />
          ) : (
            <PageSkeleton />
          )}
        </main>
      </div>

      <MobileNav onCreate={() => setCreateOpen(true)} onMore={() => setMoreOpen(true)} />

      <QuickCreate open={createOpen} onClose={() => setCreateOpen(false)} />
      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais módulos">
        <ul className="space-y-1">
          {NAV_ITEMS.filter((item) => !item.mobilePrimary).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left hover:bg-surface-hover touch-target"
                  onClick={() => {
                    setMoreOpen(false);
                    navigate(item.to);
                  }}
                >
                  <Icon className="h-5 w-5 text-accent" aria-hidden />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </div>
  );
}
