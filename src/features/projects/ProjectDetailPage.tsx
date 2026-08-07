import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { projectProgress } from '../../lib/progress';
import { formatDate } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { projects, tasks, notes, savedLinks, deleteProject, toggleTaskDone } = useData();
  const [confirm, setConfirm] = useState(false);

  const project = projects.find((item) => item.id === id);
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === id),
    [tasks, id],
  );
  const projectNotes = notes.filter((note) => note.projectId === id);
  const projectLinks = savedLinks.filter((link) => link.projectId === id);
  const progress = projectProgress(projectTasks);

  if (!project) {
    return (
      <div className="p-6">
        <EmptyState
          title="Projeto não encontrado"
          description="Este projeto não existe ou foi removido."
          actionLabel="Voltar aos projetos"
          onAction={() => navigate('/projetos')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link to="/projetos" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
            <ArrowLeft className="h-4 w-4" /> Projetos
          </Link>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-bold">
            <span className="h-3 w-3 rounded-full" style={{ background: project.color }} aria-hidden />
            {project.name}
          </h2>
          <p className="text-sm text-text-muted">{project.description || 'Sem descrição'}</p>
        </div>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Excluir
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Progresso</p>
          <p className="mt-2 text-2xl font-bold">{progress}%</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Pendentes</p>
          <p className="mt-2 text-2xl font-bold">
            {projectTasks.filter((task) => task.status !== 'done').length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Prazo</p>
          <p className="mt-2 text-lg font-bold">{project.dueDate ? formatDate(project.dueDate) : '—'}</p>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Objetivo</h3>
        <p className="mt-2 text-sm text-text-muted">{project.objective || 'Defina o objetivo deste projeto.'}</p>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Kanban de tarefas</h3>
          <Link to="/tarefas" className="text-sm font-semibold text-accent">Abrir tarefas</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(['todo', 'in_progress', 'done'] as const).map((status) => (
            <div key={status} className="rounded-[var(--radius-md)] border border-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{status}</p>
              <ul className="space-y-2">
                {projectTasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <li key={task.id} className="rounded-md border border-border px-2 py-2 text-sm">
                      <button type="button" className="w-full text-left" onClick={() => toggleTaskDone(task.id)}>
                        {task.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <h3 className="font-semibold">Notas relacionadas</h3>
          <ul className="mt-3 space-y-2">
            {projectNotes.map((note) => (
              <li key={note.id} className="text-sm">
                {note.title} {note.pinned ? <Badge tone="accent">Fixada</Badge> : null}
              </li>
            ))}
            {projectNotes.length === 0 ? <li className="text-sm text-text-muted">Nenhuma nota vinculada.</li> : null}
          </ul>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <h3 className="font-semibold">Links importantes</h3>
          <ul className="mt-3 space-y-2">
            {projectLinks.map((link) => (
              <li key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                  {link.title}
                </a>
              </li>
            ))}
            {project.links.map((link) => (
              <li key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                  {link.title}
                </a>
              </li>
            ))}
            {projectLinks.length + project.links.length === 0 ? (
              <li className="text-sm text-text-muted">Nenhum link cadastrado.</li>
            ) : null}
          </ul>
        </div>
      </section>

      <ConfirmDialog
        open={confirm}
        title="Excluir projeto?"
        description="O projeto será removido. As tarefas existentes não serão apagadas automaticamente."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deleteProject(project.id);
          toast.success('Projeto excluído');
          navigate('/projetos');
        }}
      />
    </div>
  );
}
