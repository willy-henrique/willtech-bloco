import { useEffect, useMemo, useState } from 'react';
import { Pin, Plus, Star, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

export function NotesPage() {
  const toast = useToast();
  const { notes, projects, createNote, updateNote, deleteNote } = useData();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', content: '', category: '', projectId: '' });
  const [dirty, setDirty] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((note) => !note.archived)
      .filter((note) => {
        if (!q) return true;
        return (
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes, query]);

  const selected = notes.find((note) => note.id === selectedId) || filtered[0] || null;

  const selectNote = (noteId: string) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    setSelectedId(note.id);
    setDraft({
      title: note.title,
      content: note.content,
      category: note.category || '',
      projectId: note.projectId || '',
    });
    setDirty(false);
  };

  useEffect(() => {
    if (!selectedId && filtered[0]) {
      const note = filtered[0];
      setSelectedId(note.id);
      setDraft({
        title: note.title,
        content: note.content,
        category: note.category || '',
        projectId: note.projectId || '',
      });
      setDirty(false);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (!selected || !dirty) return;
    const timer = window.setTimeout(() => {
      updateNote(selected.id, {
        title: draft.title || 'Sem título',
        content: draft.content,
        category: draft.category,
        projectId: draft.projectId || null,
      });
      setDirty(false);
      toast.info('Nota salva automaticamente');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, selected, updateNote, toast]);

  const create = () => {
    const note = createNote({ title: 'Nova nota', content: '' });
    setSelectedId(note.id);
    setDraft({ title: note.title, content: '', category: '', projectId: '' });
    setDirty(false);
    toast.success('Nota criada');
  };

  return (
    <div className="grid min-h-[70dvh] gap-0 lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-border lg:border-b-0 lg:border-r">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Notas</h2>
              <p className="text-sm text-text-muted">Ideias com salvamento automático</p>
            </div>
            <Button size="icon" onClick={create} aria-label="Nova nota">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Input
            label="Pesquisar"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar notas…"
          />
        </div>
        <ul className="max-h-[40dvh] overflow-y-auto px-2 pb-4 custom-scrollbar lg:max-h-[calc(100dvh-220px)]">
          {filtered.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => selectNote(note.id)}
                className={`mb-1 w-full rounded-[var(--radius-md)] px-3 py-3 text-left ${
                  selected?.id === note.id ? 'bg-accent-soft' : 'hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  {note.pinned ? <Pin className="h-3.5 w-3.5 text-accent" aria-hidden /> : null}
                  {note.favorite ? <Star className="h-3.5 w-3.5 text-warning" aria-hidden /> : null}
                  <p className="truncate font-medium">{note.title || 'Sem título'}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-text-subtle">{note.content || 'Sem conteúdo'}</p>
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="px-3 py-6">
              <EmptyState title="Nenhuma nota" description="Crie uma nota para capturar ideias." actionLabel="Nova nota" onAction={create} />
            </li>
          ) : null}
        </ul>
      </aside>

      <section className="p-4 md:p-6">
        {!selected ? (
          <EmptyState title="Selecione uma nota" description="Ou crie uma nova para começar a escrever." actionLabel="Nova nota" onAction={create} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateNote(selected.id, { pinned: !selected.pinned })}
              >
                <Pin className="h-4 w-4" /> {selected.pinned ? 'Desafixar' : 'Fixar'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateNote(selected.id, { favorite: !selected.favorite })}
              >
                <Star className="h-4 w-4" /> {selected.favorite ? 'Remover favorito' : 'Favoritar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(selected.id)}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
              <span className="ml-auto text-xs text-text-subtle">
                Editada {formatDateTime(selected.updatedAt)}
                {dirty ? ' · salvando…' : ''}
              </span>
            </div>
            <Input
              label="Título"
              value={draft.title}
              onChange={(event) => {
                setDraft((prev) => ({ ...prev, title: event.target.value }));
                setDirty(true);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Categoria"
                value={draft.category}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, category: event.target.value }));
                  setDirty(true);
                }}
              />
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Projeto</span>
                <select
                  className="h-11 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3"
                  value={draft.projectId}
                  onChange={(event) => {
                    setDraft((prev) => ({ ...prev, projectId: event.target.value }));
                    setDirty(true);
                  }}
                >
                  <option value="">Nenhum</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Textarea
              label="Conteúdo"
              className="min-h-[50dvh]"
              value={draft.content}
              onChange={(event) => {
                setDraft((prev) => ({ ...prev, content: event.target.value }));
                setDirty(true);
              }}
            />
            {selected.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir nota?"
        description="A nota será removida da sua biblioteca."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteNote(deleteId);
            toast.success('Nota excluída');
            setSelectedId(null);
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}
