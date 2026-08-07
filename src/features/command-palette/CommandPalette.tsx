import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  CheckSquare,
  FolderKanban,
  Moon,
  Settings,
  StickyNote,
  Sun,
  Wallet,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { NAV_ITEMS } from '../../constants/navigation';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/cn';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { tasks, projects, notes, createTask, createEvent, createNote } = useData();
  const { preference, cycle } = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) onClose();
        else {
          setQuery('');
          // parent controls open; dispatch custom event as fallback
          window.dispatchEvent(new CustomEvent('willtech:open-command'));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const actions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [
      ...NAV_ITEMS.map((item) => ({
        id: `nav-${item.to}`,
        label: `Ir para ${item.label}`,
        group: 'Navegação',
        icon: item.icon,
        run: () => navigate(item.to),
      })),
      {
        id: 'create-task',
        label: 'Criar tarefa',
        group: 'Ações',
        icon: CheckSquare,
        run: () => {
          createTask({ title: 'Nova tarefa', date: new Date().toISOString().slice(0, 10) });
          navigate('/tarefas');
        },
      },
      {
        id: 'create-event',
        label: 'Criar compromisso',
        group: 'Ações',
        icon: CalendarPlus,
        run: () => {
          createEvent({
            title: 'Novo compromisso',
            date: new Date().toISOString().slice(0, 10),
            allDay: true,
            category: 'personal',
          });
          navigate('/agenda');
        },
      },
      {
        id: 'create-note',
        label: 'Criar nota',
        group: 'Ações',
        icon: StickyNote,
        run: () => {
          createNote({ title: 'Nova nota', content: '' });
          navigate('/notas');
        },
      },
      {
        id: 'theme',
        label: `Alternar tema (atual: ${preference})`,
        group: 'Ações',
        icon: preference === 'light' ? Sun : Moon,
        run: () => {
          cycle();
        },
      },
      {
        id: 'settings',
        label: 'Abrir configurações',
        group: 'Ações',
        icon: Settings,
        run: () => navigate('/configuracoes'),
      },
      ...tasks.slice(0, 20).map((task) => ({
        id: `task-${task.id}`,
        label: `Tarefa: ${task.title}`,
        group: 'Tarefas',
        icon: CheckSquare,
        run: () => navigate('/tarefas'),
      })),
      ...projects.slice(0, 20).map((project) => ({
        id: `project-${project.id}`,
        label: `Projeto: ${project.name}`,
        group: 'Projetos',
        icon: FolderKanban,
        run: () => navigate(`/projetos/${project.id}`),
      })),
      ...notes.slice(0, 20).map((note) => ({
        id: `note-${note.id}`,
        label: `Nota: ${note.title}`,
        group: 'Notas',
        icon: StickyNote,
        run: () => navigate('/notas'),
      })),
      {
        id: 'finance',
        label: 'Ir para finanças',
        group: 'Navegação',
        icon: Wallet,
        run: () => navigate('/financas'),
      },
    ];

    if (!q) return base.slice(0, 18);
    return base.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 24);
  }, [
    query,
    navigate,
    createTask,
    createEvent,
    createNote,
    preference,
    cycle,
    tasks,
    projects,
    notes,
  ]);

  return (
    <Modal
      open={open}
      onClose={() => {
        setQuery('');
        onClose();
      }}
      title="Paleta de comandos"
      description="Navegue, pesquise e execute ações rápidas."
    >
      <input
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Digite para filtrar…"
        className="mb-3 h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3"
        aria-label="Filtrar comandos"
      />
      <ul className="max-h-[50dvh] space-y-1 overflow-y-auto custom-scrollbar" role="listbox">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left hover:bg-surface-hover',
                )}
                onClick={() => {
                  action.run();
                  onClose();
                }}
              >
                <Icon className="h-4 w-4 text-accent" aria-hidden />
                <span className="flex-1 text-sm font-medium">{action.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-text-subtle">{action.group}</span>
              </button>
            </li>
          );
        })}
        {actions.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-text-muted">Nenhum resultado.</li>
        ) : null}
      </ul>
    </Modal>
  );
}
