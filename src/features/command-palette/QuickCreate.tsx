import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  CheckSquare,
  FolderKanban,
  StickyNote,
  Target,
  Wallet,
} from 'lucide-react';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../components/ui/Toast';
import { toDateKey } from '../../lib/dates';

interface QuickCreateProps {
  open: boolean;
  onClose: () => void;
}

type CreateKind = 'task' | 'event' | 'note' | 'project' | 'transaction' | 'habit' | null;

const OPTIONS: { kind: Exclude<CreateKind, null>; label: string; icon: typeof CheckSquare }[] = [
  { kind: 'task', label: 'Nova tarefa', icon: CheckSquare },
  { kind: 'event', label: 'Novo compromisso', icon: CalendarPlus },
  { kind: 'note', label: 'Nova nota', icon: StickyNote },
  { kind: 'project', label: 'Novo projeto', icon: FolderKanban },
  { kind: 'transaction', label: 'Nova transação', icon: Wallet },
  { kind: 'habit', label: 'Novo hábito', icon: Target },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  );

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

export function QuickCreate({ open, onClose }: QuickCreateProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { createTask, createEvent, createNote, createProject, createTransaction, createHabit } = useData();
  const [kind, setKind] = useState<CreateKind>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const isDesktop = useIsDesktop();

  const reset = () => {
    setKind(null);
    setTitle('');
    setAmount('');
    setLoading(false);
    setTitleError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!kind) return;
    if (!title.trim()) {
      setTitleError('Informe um título');
      return;
    }
    setTitleError('');
    setLoading(true);
    try {
      if (kind === 'task') {
        createTask({ title: title.trim(), date: toDateKey(), dueDate: toDateKey() });
        navigate('/tarefas');
      } else if (kind === 'event') {
        createEvent({ title: title.trim(), date: toDateKey(), allDay: true, category: 'personal' });
        navigate('/agenda');
      } else if (kind === 'note') {
        createNote({ title: title.trim(), content: '' });
        navigate('/notas');
      } else if (kind === 'project') {
        const project = createProject({ name: title.trim() });
        navigate(`/projetos/${project.id}`);
      } else if (kind === 'transaction') {
        const value = Number(amount.replace(',', '.'));
        if (!Number.isFinite(value) || value <= 0) throw new Error('Informe um valor válido');
        createTransaction({
          description: title.trim(),
          amount: value,
          type: 'expense',
          dueDate: toDateKey(),
          status: 'pending',
        });
        navigate('/financas');
      } else if (kind === 'habit') {
        createHabit({ title: title.trim() });
        navigate('/habitos');
      }
      toast.success('Criado com sucesso');
      handleClose();
    } catch (error) {
      toast.error('Não foi possível criar', error instanceof Error ? error.message : undefined);
      setLoading(false);
    }
  };

  const picker = (
    <ul className="space-y-1">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <li key={option.kind}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left hover:bg-surface-hover touch-target"
              onClick={() => setKind(option.kind)}
            >
              <Icon className="h-5 w-5 text-accent" aria-hidden />
              <span className="font-medium">{option.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const form = (
    <form className="space-y-3" onSubmit={submit}>
      <Input
        label="Título"
        name="title"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (event.target.value.trim()) setTitleError('');
        }}
        error={titleError}
        required
        autoFocus
      />
      {kind === 'transaction' ? (
        <Input
          label="Valor (R$)"
          name="amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setKind(null)}>
          Voltar
        </Button>
        <Button type="submit" loading={loading}>
          Criar
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        title={kind ? OPTIONS.find((item) => item.kind === kind)?.label || 'Criar' : 'Criação rápida'}
      >
        {kind ? form : picker}
      </Modal>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={kind ? OPTIONS.find((item) => item.kind === kind)?.label || 'Criar' : 'Criação rápida'}
    >
      {kind ? form : picker}
    </BottomSheet>
  );
}
