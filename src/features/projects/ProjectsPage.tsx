import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { projectProgress } from '../../lib/progress';
import { formatDate, toDateKey } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import type { ProjectStatus, TaskPriority } from '../../types';

export function ProjectsPage() {
  const toast = useToast();
  const { projects, tasks, createProject } = useData();
  const [mode, setMode] = useState<'grid' | 'list'>('grid');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '#3fcf8e',
    status: 'active' as ProjectStatus,
    priority: 'medium' as TaskPriority,
    dueDate: '',
    objective: '',
  });

  const items = useMemo(
    () =>
      projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        return {
          project,
          progress: projectProgress(projectTasks),
          pending: projectTasks.filter((task) => task.status !== 'done').length,
        };
      }),
    [projects, tasks],
  );

  const save = () => {
    if (!form.name.trim()) return;
    const project = createProject({
      ...form,
      startDate: toDateKey(),
      dueDate: form.dueDate || null,
    });
    toast.success('Projeto criado');
    setOpen(false);
    window.location.href = `/projetos/${project.id}`;
  };

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Projetos</h2>
          <p className="text-sm text-text-muted">Pessoais, profissionais e acadêmicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === 'grid' ? 'secondary' : 'ghost'} size="icon" aria-label="Grade" onClick={() => setMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={mode === 'list' ? 'secondary' : 'ghost'} size="icon" aria-label="Lista" onClick={() => setMode('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo projeto
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhum projeto ainda"
          description="Crie um projeto para agrupar tarefas, notas e links."
          actionLabel="Criar projeto"
          onAction={() => setOpen(true)}
        />
      ) : mode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ project, progress, pending }) => (
            <Link
              key={project.id}
              to={`/projetos/${project.id}`}
              className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4 hover:bg-surface-hover"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: project.color }} aria-hidden />
                <h3 className="font-semibold">{project.name}</h3>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-text-muted">{project.description || 'Sem descrição'}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-muted">
                <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-text-subtle">
                <span>{progress}% · {pending} pendentes</span>
                {project.dueDate ? <span>até {formatDate(project.dueDate)}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(({ project, progress, pending }) => (
            <li key={project.id}>
              <Link
                to={`/projetos/${project.id}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated/70 px-3 py-3"
              >
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-text-subtle">{pending} tarefas pendentes · {progress}%</p>
                </div>
                <Badge>{project.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo projeto"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Criar</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Nome" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <Textarea label="Descrição" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <Input label="Objetivo" value={form.objective} onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Cor" type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} />
            <Input label="Prazo" type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'paused', label: 'Pausado' },
                { value: 'completed', label: 'Concluído' },
                { value: 'archived', label: 'Arquivado' },
              ]}
            />
            <Select
              label="Prioridade"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
              options={[
                { value: 'critical', label: 'Crítica' },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Média' },
                { value: 'low', label: 'Baixa' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
