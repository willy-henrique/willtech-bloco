import React, { useMemo, useState } from 'react';
import { useApp } from '../../AppContext';
import { useToast } from '../../hooks/useToast';
import { isInboxTask, taskTitle } from '../../lib/domain';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { todayAt, tomorrowAt } from '../../lib/dates';
import type { Task } from '../../types';

export const InboxPage: React.FC = () => {
  const { tasks, projects, notes, isLoading, updateTask, deleteTask, addNote, addTask } = useApp();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Task | null>(null);

  const inbox = useMemo(
    () => tasks.filter((t) => !t.isCompleted && !t.archived && isInboxTask(t)),
    [tasks]
  );

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Coisas ainda não organizadas"
      />
      {isLoading ? (
        <ListSkeleton />
      ) : inbox.length === 0 ? (
        <EmptyState
          title="Inbox vazia"
          description="Tudo organizado. Novas capturas sem projeto aparecem aqui."
        />
      ) : (
        <ul className="space-y-2">
          {inbox.map((task) => (
            <li
              key={task.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setSelected(selected?.id === task.id ? null : task)}
              >
                <p className="font-medium">{taskTitle(task)}</p>
                <p className="meta-text mt-1">Toque para organizar</p>
              </button>
              {selected?.id === task.id && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                  <Button
                    variant="soft"
                    onClick={async () => {
                      await updateTask(task.id, {
                        inbox: false,
                        status: 'active',
                        dueAt: todayAt(9),
                      });
                      toast('Transformado em tarefa para hoje');
                      setSelected(null);
                    }}
                  >
                    Tarefa hoje
                  </Button>
                  <Button
                    variant="soft"
                    onClick={async () => {
                      await updateTask(task.id, {
                        inbox: false,
                        status: 'active',
                        dueAt: tomorrowAt(9),
                      });
                      toast('Agendado para amanhã');
                      setSelected(null);
                    }}
                  >
                    Amanhã
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await addNote({
                        title: taskTitle(task),
                        content: task.description,
                      });
                      await deleteTask(task.id);
                      toast('Convertido em nota');
                      setSelected(null);
                    }}
                  >
                    Virar nota
                  </Button>
                  <select
                    aria-label="Atribuir projeto"
                    className="min-h-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-2 text-sm"
                    defaultValue=""
                    onChange={async (e) => {
                      const projectId = e.target.value;
                      if (!projectId) return;
                      await updateTask(task.id, {
                        projectId,
                        inbox: false,
                        status: 'active',
                      });
                      toast('Atribuído ao projeto');
                      setSelected(null);
                    }}
                  >
                    <option value="">Projeto…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await updateTask(task.id, { archived: true, status: 'archived', inbox: false });
                      toast('Arquivado');
                      setSelected(null);
                    }}
                  >
                    Arquivar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      const snapshot = task;
                      await deleteTask(task.id);
                      toast('Excluído', {
                        label: 'Desfazer',
                        onClick: () =>
                          void addTask(snapshot.projectId, snapshot.description, snapshot.priority, {
                            title: snapshot.title,
                            inbox: true,
                            status: 'inbox',
                          }),
                      });
                      setSelected(null);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {notes.length > 0 && (
        <p className="meta-text mt-8">
          {notes.length} nota(s) · organize também em Notas / Tudo
        </p>
      )}
    </div>
  );
};
