import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../AppContext';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import type { Note } from '../../types/item';

export const NotesPage: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useApp();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  const active = useMemo(
    () => notes.find((n) => n.id === activeId) || null,
    [notes, activeId]
  );

  useEffect(() => {
    if (params.get('new') !== '1') return;
    let cancelled = false;
    void (async () => {
      const id = await addNote({ title: 'Nova nota', content: '' });
      if (cancelled) return;
      setActiveId(id);
      setDraftTitle('Nova nota');
      setDraftContent('');
      setParams({});
      toast('Nota criada');
    })();
    return () => {
      cancelled = true;
    };
  }, [params, addNote, setParams, toast]);

  useEffect(() => {
    if (!activeId || !active) return;
    const handle = window.setTimeout(() => {
      if (draftTitle !== active.title || draftContent !== active.content) {
        void updateNote(activeId, { title: draftTitle, content: draftContent });
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [draftTitle, draftContent, activeId, active, updateNote]);

  const openNote = (note: Note) => {
    setActiveId(note.id);
    setDraftTitle(note.title);
    setDraftContent(note.content);
  };

  const createNote = async () => {
    const id = await addNote({ title: 'Nova nota', content: '' });
    setActiveId(id);
    setDraftTitle('Nova nota');
    setDraftContent('');
  };

  return (
    <div>
      <PageHeader
        title="Notas"
        subtitle="Bloco simples com autosave"
        actions={<Button onClick={() => void createNote()}>Nova</Button>}
      />

      {!activeId ? (
        notes.length === 0 ? (
          <EmptyState
            title="Você ainda não criou nenhuma nota."
            description="Crie instantaneamente e escreva sem se preocupar em salvar."
            action={
              <Button variant="soft" onClick={() => void createNote()}>
                Criar nota
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => openNote(note)}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left"
                >
                  <p className="font-medium">{note.title || 'Sem título'}</p>
                  <p className="meta-text mt-1 line-clamp-2">{note.content || 'Vazia'}</p>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div>
          <div className="mb-3 flex gap-2">
            <Button variant="ghost" onClick={() => setActiveId(null)}>
              Voltar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await deleteNote(activeId);
                setActiveId(null);
                toast('Nota excluída');
              }}
            >
              Excluir
            </Button>
          </div>
          <input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="mb-3 w-full border-none bg-transparent font-display text-2xl outline-none"
            placeholder="Título"
          />
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="min-h-[50vh] w-full resize-none border-none bg-transparent text-[var(--text)] outline-none"
            placeholder="Escreva… Markdown básico é bem-vindo."
          />
          <p className="meta-text">Salvo automaticamente</p>
        </div>
      )}
    </div>
  );
};
