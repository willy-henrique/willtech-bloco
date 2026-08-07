import { useMemo, useState, type FormEvent } from 'react';
import { BellRing, Check, StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../lib/dates';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';

type CaptureMode = 'note' | 'reminder';

export function QuickCapture() {
  const toast = useToast();
  const {
    notes,
    reminders,
    createNote,
    createReminder,
    completeReminder,
  } = useData();
  const [mode, setMode] = useState<CaptureMode>('note');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const recentNotes = useMemo(
    () =>
      notes
        .filter((note) => !note.archived)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 3),
    [notes],
  );

  const openReminders = useMemo(
    () =>
      reminders
        .filter((item) => !item.completed)
        .sort((a, b) => a.dueAt - b.dueAt)
        .slice(0, 4),
    [reminders],
  );

  const save = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;

    setSaving(true);
    try {
      if (mode === 'note') {
        const title = value.length > 60 ? `${value.slice(0, 57)}…` : value;
        createNote({
          title,
          content: value,
        });
        toast.success('Anotação salva');
      } else {
        createReminder({ title: value });
        toast.success('Lembrete criado');
      }
      setText('');
    } catch (error) {
      toast.error(
        'Não foi possível salvar',
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/80 p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Captura rápida</h2>
          <p className="text-sm text-text-muted">Anote ideias ou crie lembretes sem fricção</p>
        </div>
        <div className="inline-flex rounded-[var(--radius-md)] border border-border bg-bg p-1">
          <button
            type="button"
            onClick={() => setMode('note')}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition',
              mode === 'note' ? 'bg-accent text-accent-fg' : 'text-text-muted hover:text-text',
            )}
            aria-pressed={mode === 'note'}
          >
            <StickyNote className="h-4 w-4" aria-hidden />
            Anotação
          </button>
          <button
            type="button"
            onClick={() => setMode('reminder')}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition',
              mode === 'reminder' ? 'bg-accent text-accent-fg' : 'text-text-muted hover:text-text',
            )}
            aria-pressed={mode === 'reminder'}
          >
            <BellRing className="h-4 w-4" aria-hidden />
            Lembrete
          </button>
        </div>
      </div>

      <form onSubmit={save} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="sr-only">
            {mode === 'note' ? 'Texto da anotação' : 'Texto do lembrete'}
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            placeholder={
              mode === 'note'
                ? 'Escreva uma ideia, observação ou rascunho…'
                : 'Do que você quer se lembrar?'
            }
            className="min-h-[72px] w-full resize-y rounded-[var(--radius-md)] border border-border bg-bg px-3 py-2.5 text-text placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent/20"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </label>
        <Button type="submit" loading={saving} disabled={!text.trim()} className="sm:mb-0.5">
          {mode === 'note' ? 'Salvar anotação' : 'Criar lembrete'}
        </Button>
      </form>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
              Anotações recentes
            </p>
            <Link to="/notas" className="text-xs font-semibold text-accent">
              Ver todas
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhuma anotação ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentNotes.map((note) => (
                <li key={note.id} className="rounded-[var(--radius-md)] border border-border px-3 py-2">
                  <p className="truncate text-sm font-medium">{note.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-subtle">
                    {note.content || 'Sem conteúdo'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">
            Lembretes abertos
          </p>
          {openReminders.length === 0 ? (
            <p className="text-sm text-text-muted">Nenhum lembrete pendente.</p>
          ) : (
            <ul className="space-y-2">
              {openReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2"
                >
                  <button
                    type="button"
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border hover:border-accent"
                    aria-label={`Concluir lembrete ${reminder.title}`}
                    onClick={() => {
                      completeReminder(reminder.id);
                      toast.success('Lembrete concluído');
                    }}
                  >
                    <Check className="h-3.5 w-3.5 text-accent" />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{reminder.title}</p>
                    <p className="text-xs text-text-subtle">{formatDateTime(reminder.dueAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
