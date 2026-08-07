import { useMemo, useState } from 'react';
import { CheckSquare, Copy, Filter, LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { taskFormSchema } from '../../schemas/task';
import { isOverdue, toDateKey, formatDate } from '../../lib/dates';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../constants/defaults';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import type { Task, TaskPriority, TaskStatus } from '../../types';
import { readJSON, writeJSON } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';

type View = 'list' | 'today' | 'upcoming' | 'overdue' | 'done' | 'project' | 'kanban';

const FILTER_KEY = 'task-filters';

export function TasksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { tasks, projects, createTask, updateTask, deleteTask, toggleTaskDone } = useData();
  const saved = readJSON<{ view: View; query: string; priority: string; projectId: string }>(
    `willtech.v2:${user?.id || 'anon'}:${FILTER_KEY}`,
    { view: 'list', query: '', priority: 'all', projectId: 'all' },
  );

  const [view, setView] = useState<View>(saved.view);
  const [query, setQuery] = useState(saved.query);
  const [priority, setPriority] = useState(saved.priority);
  const [projectId, setProjectId] = useState(saved.projectId);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: toDateKey(),
    projectId: '',
    category: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const persistFilters = (next: Partial<typeof saved>) => {
    writeJSON(`willtech.v2:${user?.id || 'anon'}:${FILTER_KEY}`, {
      view,
      query,
      priority,
      projectId,
      ...next,
    });
  };

  const filtered = useMemo(() => {
    const today = toDateKey();
    return tasks
      .filter((task) => {
        if (view === 'today') return (task.date === today || task.dueDate === today) && task.status !== 'done';
        if (view === 'upcoming') return Boolean(task.dueDate && task.dueDate > today && task.status !== 'done');
        if (view === 'overdue') return isOverdue(task.dueDate || task.date, task.status === 'done');
        if (view === 'done') return task.status === 'done';
        if (view === 'project') return Boolean(task.projectId);
        if (view === 'kanban') return task.status !== 'archived';
        return task.status !== 'archived';
      })
      .filter((task) => (priority === 'all' ? true : task.priority === priority))
      .filter((task) => (projectId === 'all' ? true : task.projectId === projectId))
      .filter((task) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          task.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [tasks, view, priority, projectId, query]);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: toDateKey(),
      projectId: '',
      category: '',
      notes: '',
    });
    setErrors({});
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setCreating(true);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      projectId: task.projectId || '',
      category: task.category || '',
      notes: task.notes || '',
    });
    setErrors({});
  };

  const save = () => {
    const parsed = taskFormSchema.safeParse({
      ...form,
      projectId: form.projectId || null,
      dueDate: form.dueDate || null,
      tags: [],
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        updateTask(editing.id, {
          ...parsed.data,
          projectId: parsed.data.projectId || null,
        });
        toast.success('Tarefa atualizada');
      } else {
        createTask({
          ...parsed.data,
          date: parsed.data.dueDate || toDateKey(),
          projectId: parsed.data.projectId || null,
        });
        toast.success('Tarefa criada');
      }
      setCreating(false);
    } finally {
      setLoading(false);
    }
  };

  const columns: TaskStatus[] = ['todo', 'in_progress', 'done'];

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tarefas</h2>
          <p className="text-sm text-text-muted">Gerencie o que precisa ser feito</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova tarefa
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-3 md:p-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['list', 'Lista'],
              ['today', 'Hoje'],
              ['upcoming', 'Próximas'],
              ['overdue', 'Atrasadas'],
              ['done', 'Concluídas'],
              ['project', 'Por projeto'],
              ['kanban', 'Kanban'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setView(id);
                persistFilters({ view: id });
              }}
              className={`rounded-md border px-3 py-2 text-xs font-semibold touch-target ${
                view === id ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <Input
            label="Pesquisar"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              persistFilters({ query: event.target.value });
            }}
            placeholder="Título, tag, descrição…"
          />
          <Select
            label="Prioridade"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              persistFilters({ priority: event.target.value });
            }}
            options={[
              { value: 'all', label: 'Todas' },
              ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
          <Select
            label="Projeto"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              persistFilters({ projectId: event.target.value });
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...projects.map((project) => ({ value: project.id, label: project.name })),
            ]}
          />
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border bg-accent-soft px-3 py-2">
          <Filter className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">{selected.length} selecionadas</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              selected.forEach((id) => toggleTaskDone(id));
              setSelected([]);
              toast.success('Tarefas atualizadas');
            }}
          >
            Concluir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              selected.forEach((id) => {
                const task = tasks.find((item) => item.id === id);
                if (task) createTask({ ...task, title: `${task.title} (cópia)` });
              });
              setSelected([]);
              toast.success('Tarefas duplicadas');
            }}
          >
            <Copy className="h-4 w-4" /> Duplicar
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma tarefa nesta visualização"
          description="Ajuste os filtros ou crie uma nova tarefa para começar."
          actionLabel="Nova tarefa"
          onAction={openCreate}
          icon={view === 'kanban' ? <LayoutGrid className="h-6 w-6" /> : <List className="h-6 w-6" />}
        />
      ) : view === 'kanban' ? (
        <div className="grid gap-3 md:grid-cols-3">
          {columns.map((status) => (
            <div key={status} className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/60 p-3">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
                {STATUS_LABELS[status]}
              </h3>
              <ul className="space-y-2">
                {filtered
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 py-3 text-left hover:bg-surface-hover"
                        onClick={() => openEdit(task)}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('text/task-id', task.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          const id = event.dataTransfer.getData('text/task-id');
                          if (id) {
                            updateTask(id, {
                              status,
                              completedAt: status === 'done' ? Date.now() : null,
                            });
                          }
                        }}
                      >
                        <p className="font-medium">{task.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge>{PRIORITY_LABELS[task.priority]}</Badge>
                          {task.dueDate ? <span className="text-xs text-text-subtle">{formatDate(task.dueDate)}</span> : null}
                        </div>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((task) => {
            const project = projects.find((item) => item.id === task.projectId);
            const checked = selected.includes(task.id);
            return (
              <li
                key={task.id}
                className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 px-3 py-3"
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={checked}
                  onChange={() =>
                    setSelected((prev) =>
                      checked ? prev.filter((id) => id !== task.id) : [...prev, task.id],
                    )
                  }
                  aria-label={`Selecionar ${task.title}`}
                />
                <button
                  type="button"
                  className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-border"
                  aria-label={task.status === 'done' ? 'Reabrir' : 'Concluir'}
                  onClick={() => {
                    toggleTaskDone(task.id);
                    toast.success(task.status === 'done' ? 'Tarefa reaberta' : 'Tarefa concluída');
                  }}
                >
                  <CheckSquare className={`h-4 w-4 ${task.status === 'done' ? 'text-accent' : 'text-text-subtle'}`} />
                </button>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openEdit(task)}>
                  <p className={`font-medium ${task.status === 'done' ? 'line-through text-text-subtle' : ''}`}>
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone={task.priority === 'critical' || task.priority === 'high' ? 'warning' : 'default'}>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                    <Badge>{STATUS_LABELS[task.status]}</Badge>
                    {project ? <span className="text-xs text-text-subtle">{project.name}</span> : null}
                    {task.dueDate ? <span className="text-xs text-text-subtle">{formatDate(task.dueDate)}</span> : null}
                    {isOverdue(task.dueDate || task.date, task.status === 'done') ? (
                      <Badge tone="danger">Atrasada</Badge>
                    ) : null}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir tarefa"
                  onClick={() => setDeleteId(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={editing ? 'Editar tarefa' : 'Nova tarefa'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={save} loading={loading}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            label="Título"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            error={errors.title}
            required
          />
          <Textarea
            label="Descrição"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Select
              label="Prioridade"
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
              options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Input
              label="Prazo"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
            <Select
              label="Projeto"
              value={form.projectId}
              onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
              options={[
                { value: '', label: 'Nenhum' },
                ...projects.map((project) => ({ value: project.id, label: project.name })),
              ]}
            />
          </div>
          <Input
            label="Categoria"
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
          />
          <Textarea
            label="Observações"
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir tarefa?"
        description="A tarefa será arquivada logicamente e deixará de aparecer nas listas."
        confirmLabel="Excluir"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteTask(deleteId);
            toast.success('Tarefa excluída');
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}
