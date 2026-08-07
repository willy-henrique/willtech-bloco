import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  FileText,
  Bell,
  Search,
  Sun,
  Inbox,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onCapture: () => void;
  onNavigate: (path: string) => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  run: () => void;
  keywords?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onCapture,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const commands: Command[] = useMemo(
    () => [
      { id: 'capture', label: 'Captura rápida', icon: CheckSquare, run: onCapture, keywords: 'nova tarefa' },
      { id: 'note', label: 'Nova nota', icon: FileText, run: () => onNavigate('/notas?new=1'), keywords: 'nota' },
      {
        id: 'task',
        label: 'Nova tarefa',
        icon: CheckSquare,
        run: onCapture,
        keywords: 'tarefa',
      },
      {
        id: 'reminder',
        label: 'Novo lembrete',
        icon: Bell,
        run: onCapture,
        keywords: 'lembrete',
      },
      {
        id: 'project',
        label: 'Novo projeto',
        icon: FolderKanban,
        run: () => onNavigate('/projetos?new=1'),
        keywords: 'projeto',
      },
      { id: 'search', label: 'Buscar', icon: Search, run: () => onNavigate('/tudo'), keywords: 'tudo' },
      { id: 'today', label: 'Ir para Hoje', icon: Sun, run: () => onNavigate('/'), keywords: 'hoje' },
      { id: 'inbox', label: 'Ir para Inbox', icon: Inbox, run: () => onNavigate('/inbox') },
      { id: 'agenda', label: 'Ir para Agenda', icon: CalendarDays, run: () => onNavigate('/agenda') },
    ],
    [onCapture, onNavigate]
  );

  const filtered = commands.filter((c) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return c.label.toLowerCase().includes(q) || (c.keywords || '').includes(q);
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Enter' && filtered[0]) {
                  filtered[0].run();
                  onClose();
                }
              }}
              placeholder="Comando ou ação…"
              className="w-full border-b border-[var(--border)] bg-transparent px-4 py-4 text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            />
            <ul className="max-h-80 overflow-y-auto p-2">
              {filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <li key={cmd.id}>
                    <button
                      type="button"
                      className="flex w-full min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)]"
                      onClick={() => {
                        cmd.run();
                        onClose();
                      }}
                    >
                      <Icon size={18} />
                      {cmd.label}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                  Nenhum comando. Digite para capturar em “Captura rápida”.
                </li>
              )}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
