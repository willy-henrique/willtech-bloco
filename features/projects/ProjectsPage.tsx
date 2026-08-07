import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { taskTitle } from '../../lib/domain';
import type { Project } from '../../types';

export const ProjectsPage: React.FC = () => {
  const { projects, tasks, notes, events, addProject, updateProject, deleteProject } = useApp();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (params.get('new') === '1') {
      setCreating(true);
      setParams({});
    }
  }, [params, setParams]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const projectTasks = tasks.filter((t) => t.projectId === selectedId && !t.archived);
  const projectNotes = notes.filter((n) => n.projectId === selectedId && !n.archived);
  const projectEvents = events.filter((e) => e.projectId === selectedId && !e.archived);

  const create = async () => {
    if (!name.trim()) return;
    const id = await addProject({
      name: name.trim(),
      type: 'Pessoal',
      status: 'Active',
      progress: 0,
      color: '#2f6f5e',
      description: description.trim() || undefined,
    });
    toast('Projeto criado ✓');
    setCreating(false);
    setName('');
    setDescription('');
    if (typeof id === 'string') setSelectedId(id);
  };

  if (creating) {
    return (
      <div>
        <PageHeader title="Novo projeto" />
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
            rows={3}
          />
          <div className="flex gap-2">
            <Button onClick={() => void create()}>Criar</Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <div className="mb-4 flex gap-2">
          <Button variant="ghost" onClick={() => setSelectedId(null)}>
            Voltar
          </Button>
          <Button variant="ghost" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? 'Ocultar avançado' : 'Avançado'}
          </Button>
        </div>
        <PageHeader
          title={selected.name}
          subtitle={selected.description || selected.status}
          actions={
            <Button
              variant="danger"
              onClick={async () => {
                await deleteProject(selected.id);
                setSelectedId(null);
                toast('Projeto removido');
              }}
            >
              Excluir
            </Button>
          }
        />
        <section className="mb-6">
          <h2 className="section-title mb-3">Tarefas</h2>
          {projectTasks.length === 0 ? (
            <p className="meta-text">Nenhuma tarefa neste projeto.</p>
          ) : (
            <ul className="space-y-2">
              {projectTasks.map((t) => (
                <li key={t.id} className="rounded-[var(--radius-md)] bg-[var(--surface)] px-3 py-2">
                  {taskTitle(t)}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mb-6">
          <h2 className="section-title mb-3">Notas</h2>
          {projectNotes.length === 0 ? (
            <p className="meta-text">Nenhuma nota.</p>
          ) : (
            <ul className="space-y-2">
              {projectNotes.map((n) => (
                <li key={n.id} className="rounded-[var(--radius-md)] bg-[var(--surface)] px-3 py-2">
                  {n.title}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mb-6">
          <h2 className="section-title mb-3">Eventos</h2>
          {projectEvents.length === 0 ? (
            <p className="meta-text">Nenhum evento.</p>
          ) : (
            <ul className="space-y-2">
              {projectEvents.map((e) => (
                <li key={e.id} className="rounded-[var(--radius-md)] bg-[var(--surface)] px-3 py-2">
                  {e.title}
                </li>
              ))}
            </ul>
          )}
        </section>
        {showAdvanced && (
          <section className="rounded-[var(--radius-md)] border border-[var(--border)] p-4">
            <h2 className="section-title mb-3">Ferramentas OPS</h2>
            <p className="mb-3 text-sm text-[var(--muted)]">
              Credenciais, pagamentos e detalhes técnicos do projeto antigo.
            </p>
            <Button variant="soft" onClick={() => navigate(`/ops/projeto/${selected.id}`)}>
              Abrir detalhes avançados
            </Button>
            <div className="mt-4 space-y-2">
              <label className="block text-sm">
                Status
                <select
                  className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                  value={selected.status}
                  onChange={(e) =>
                    void updateProject(selected.id, {
                      status: e.target.value as Project['status'],
                    })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Legacy">Legacy</option>
                </select>
              </label>
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle="Contexto sem burocracia"
        actions={<Button onClick={() => setCreating(true)}>Novo</Button>}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto ainda"
          description="Crie um hub simples para agrupar tarefas e notas."
          action={<Button variant="soft" onClick={() => setCreating(true)}>Criar projeto</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => {
            const count = tasks.filter((t) => t.projectId === project.id && !t.isCompleted).length;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: project.color || 'var(--primary)' }}
                    aria-hidden
                  />
                  <span className="flex-1 font-medium">{project.name}</span>
                  <span className="meta-text">{count} abertas</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
