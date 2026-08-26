import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Plus,
  Trash2,
  UserRoundCheck,
  X,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Task, TaskPriority } from '../types';

const QUADRANTS: Array<{
  priority: TaskPriority;
  title: string;
  action: string;
  description: string;
  icon: typeof AlertTriangle;
  tone: 'rose' | 'amber' | 'blue' | 'neutral';
  coordinate: string;
}> = [
  {
    priority: TaskPriority.CRITICAL,
    title: 'Fazer agora',
    action: 'Urgente + importante',
    description: 'Itens que bloqueiam a operação e precisam de ação imediata.',
    icon: AlertTriangle,
    tone: 'rose',
    coordinate: 'Q1',
  },
  {
    priority: TaskPriority.URGENT,
    title: 'Agendar',
    action: 'Importante, não urgente',
    description: 'Trabalho estratégico que merece espaço protegido na agenda.',
    icon: CalendarClock,
    tone: 'amber',
    coordinate: 'Q2',
  },
  {
    priority: TaskPriority.NORMAL,
    title: 'Delegar',
    action: 'Urgente, menos importante',
    description: 'Demandas que podem avançar com apoio ou automação.',
    icon: UserRoundCheck,
    tone: 'blue',
    coordinate: 'Q3',
  },
  {
    priority: TaskPriority.LOW,
    title: 'Reavaliar',
    action: 'Nem urgente, nem importante',
    description: 'Backlog sem compromisso: simplifique, adie ou elimine.',
    icon: CircleDot,
    tone: 'neutral',
    coordinate: 'Q4',
  },
];

const TONE = {
  rose: {
    icon: 'border-rose-400/15 bg-rose-400/[0.07] text-rose-300',
    dot: 'bg-rose-400',
    button: 'hover:border-rose-400/20 hover:text-rose-200',
  },
  amber: {
    icon: 'border-amber-400/15 bg-amber-400/[0.07] text-amber-300',
    dot: 'bg-amber-300',
    button: 'hover:border-amber-400/20 hover:text-amber-200',
  },
  blue: {
    icon: 'border-sky-400/15 bg-sky-400/[0.07] text-sky-300',
    dot: 'bg-sky-300',
    button: 'hover:border-sky-400/20 hover:text-sky-200',
  },
  neutral: {
    icon: 'border-white/[0.08] bg-white/[0.035] text-neutral-500',
    dot: 'bg-neutral-500',
    button: 'hover:border-white/[0.12] hover:text-neutral-200',
  },
};

const EisenhowerMatrix: React.FC = () => {
  const { tasks, projects, toggleTask, deleteTask, addTask } = useApp();
  const [editingQuadrant, setEditingQuadrant] = useState<TaskPriority | null>(null);
  const [newTaskText, setNewTaskText] = useState<Record<TaskPriority, string>>({
    [TaskPriority.CRITICAL]: '',
    [TaskPriority.URGENT]: '',
    [TaskPriority.NORMAL]: '',
    [TaskPriority.LOW]: '',
  });

  const openTasks = tasks.filter((task) => !task.isCompleted);
  const filterTasks = (priority: TaskPriority) => openTasks.filter((task) => task.priority === priority);

  const handleAddTask = async (priority: TaskPriority) => {
    const description = newTaskText[priority].trim();
    if (!description) return;

    try {
      await addTask('Geral', description, priority);
      setNewTaskText((current) => ({ ...current, [priority]: '' }));
      setEditingQuadrant(null);
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const handleClearAll = async (priority: TaskPriority) => {
    const quadrantTasks = filterTasks(priority);
    if (!window.confirm(`Excluir as ${quadrantTasks.length} tarefas desta área? Essa ação não pode ser desfeita.`)) return;

    for (const task of quadrantTasks) {
      await deleteTask(task.id);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300/65">Matriz de decisão</p>
          <h3 className="mt-1.5 text-base font-semibold text-neutral-100">Escolha o trabalho certo</h3>
          <p className="mt-1 text-xs text-neutral-600">{openTasks.length} itens aguardando decisão ou execução.</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-neutral-700">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> urgente</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> estratégico</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" /> delegável</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {QUADRANTS.map((quadrant) => (
          <Quadrant
            key={quadrant.priority}
            {...quadrant}
            tasks={filterTasks(quadrant.priority)}
            projects={projects}
            isEditing={editingQuadrant === quadrant.priority}
            inputValue={newTaskText[quadrant.priority]}
            onInputChange={(value) => setNewTaskText((current) => ({ ...current, [quadrant.priority]: value }))}
            onStartAdding={() => setEditingQuadrant(quadrant.priority)}
            onCancelAdding={() => {
              setEditingQuadrant(null);
              setNewTaskText((current) => ({ ...current, [quadrant.priority]: '' }));
            }}
            onAdd={() => void handleAddTask(quadrant.priority)}
            onToggle={(taskId) => void toggleTask(taskId)}
            onDelete={(taskId) => void deleteTask(taskId)}
            onClear={() => void handleClearAll(quadrant.priority)}
          />
        ))}
      </div>
    </div>
  );
};

interface QuadrantProps {
  priority: TaskPriority;
  title: string;
  action: string;
  description: string;
  icon: typeof AlertTriangle;
  tone: keyof typeof TONE;
  coordinate: string;
  tasks: Task[];
  projects: ReturnType<typeof useApp>['projects'];
  isEditing: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onStartAdding: () => void;
  onCancelAdding: () => void;
  onAdd: () => void;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onClear: () => void;
}

const Quadrant: React.FC<QuadrantProps> = ({
  title,
  action,
  description,
  icon: Icon,
  tone,
  coordinate,
  tasks,
  projects,
  isEditing,
  inputValue,
  onInputChange,
  onStartAdding,
  onCancelAdding,
  onAdd,
  onToggle,
  onDelete,
  onClear,
}) => {
  const styles = TONE[tone];

  return (
    <article className="flex min-h-[350px] flex-col overflow-hidden rounded-[18px] border border-white/[0.065] bg-black/10">
      <header className="border-b border-white/[0.055] p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${styles.icon}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-neutral-200">{title}</h4>
                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-neutral-700">{coordinate}</span>
              </div>
              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-600">{action}</p>
            </div>
          </div>
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] tabular-nums text-neutral-500">
            {tasks.length}
          </span>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-neutral-600">{description}</p>
      </header>

      <AnimatePresence initial={false}>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.055]"
          >
            <div className="flex gap-2 p-3">
              <input
                type="text"
                placeholder="Descreva a próxima ação..."
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onAdd();
                  if (event.key === 'Escape') onCancelAdding();
                }}
                className="field-control h-10 flex-1"
                autoFocus
              />
              <button
                type="button"
                onClick={onAdd}
                disabled={!inputValue.trim()}
                aria-label="Adicionar tarefa"
                className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300 text-[#07110c] transition disabled:opacity-30"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={onCancelAdding}
                aria-label="Cancelar"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-neutral-500 transition hover:text-neutral-200"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="custom-scrollbar flex max-h-[330px] flex-1 flex-col overflow-y-auto p-3">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => {
              const project = projects.find((item) => item.id === task.projectId);
              return (
                <motion.div
                  layout
                  key={task.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="group flex items-start gap-2.5 rounded-[13px] border border-white/[0.055] bg-white/[0.018] p-3 transition hover:border-white/[0.1] hover:bg-white/[0.03]"
                >
                  <button
                    type="button"
                    onClick={() => onToggle(task.id)}
                    title="Marcar como concluída"
                    className="mt-0.5 shrink-0 text-neutral-700 transition hover:text-emerald-300"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-5 text-neutral-300">{task.description}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`h-1 w-1 rounded-full ${styles.dot}`} />
                      <span className="truncate text-[8px] font-medium uppercase tracking-[0.12em] text-neutral-700">
                        {project?.name || task.projectId || 'Geral'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    title="Excluir tarefa"
                    className="shrink-0 rounded-lg p-1.5 text-neutral-800 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {tasks.length === 0 && !isEditing && (
          <div className="flex flex-1 flex-col items-center justify-center py-9 text-center">
            <Clock3 size={20} className="text-neutral-800" />
            <p className="mt-3 text-xs font-medium text-neutral-500">Área livre</p>
            <p className="mt-1 text-[10px] text-neutral-700">Nenhuma tarefa neste quadrante.</p>
          </div>
        )}

        {!isEditing && (
          <div className="mt-auto flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onStartAdding}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.07] px-3 py-2.5 text-[10px] font-medium text-neutral-600 transition ${styles.button}`}
            >
              <Plus size={13} /> Adicionar tarefa
            </button>
            {tasks.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                title="Limpar quadrante"
                aria-label="Limpar quadrante"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] text-neutral-800 transition hover:border-rose-400/15 hover:text-rose-300"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default EisenhowerMatrix;
