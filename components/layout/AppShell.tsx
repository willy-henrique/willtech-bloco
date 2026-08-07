import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';
import { QuickCapture } from '../../features/capture/QuickCapture';
import { CommandPalette } from '../../features/command-palette/CommandPalette';

export const AppShell: React.FC = () => {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell flex bg-transparent text-[var(--text)]">
      <Sidebar />
      <div className="relative flex min-h-dvh flex-1 flex-col">
        <div className="hidden items-center justify-end gap-2 px-6 pt-4 lg:flex">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]"
          >
            ⌘K
          </button>
          <button
            type="button"
            aria-label="Nova captura"
            onClick={() => setCaptureOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-medium text-white dark:text-[#0f1412]"
          >
            <Plus size={18} aria-hidden />
            Capturar
          </button>
        </div>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 sm:px-6 lg:pb-10 lg:pt-2">
          <Outlet context={{ openCapture: () => setCaptureOpen(true) }} />
        </main>
        <BottomNavigation onCapture={() => setCaptureOpen(true)} />
      </div>

      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onCapture={() => {
          setPaletteOpen(false);
          setCaptureOpen(true);
        }}
        onNavigate={(path) => {
          setPaletteOpen(false);
          navigate(path);
        }}
      />
    </div>
  );
};
