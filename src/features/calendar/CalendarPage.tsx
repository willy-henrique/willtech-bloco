import { useMemo, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, formatDate, startOfWeek, toDateKey } from '../../lib/dates';
import { useData } from '../../contexts/DataContext';
import { eventFormSchema } from '../../schemas/event';
import { EVENT_CATEGORY_COLORS, EVENT_CATEGORY_LABELS } from '../../constants/defaults';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import type { CalendarEvent, EventCategory } from '../../types';

type CalView = 'day' | 'week' | 'month' | 'list';

export function CalendarPage() {
  const toast = useToast();
  const { events, tasks, createEvent, updateEvent, deleteEvent } = useData();
  const [view, setView] = useState<CalView>('day');
  const [cursor, setCursor] = useState(toDateKey());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: toDateKey(),
    startTime: '',
    endTime: '',
    allDay: true,
    category: 'personal' as EventCategory,
    location: '',
    meetingUrl: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cursorDate = useMemo(() => new Date(`${cursor}T12:00:00`), [cursor]);

  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => event.date === cursor)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
    [events, cursor],
  );

  const dayTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === cursor || task.date === cursor),
    [tasks, cursor],
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursorDate, 1);
    return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(start, index)));
  }, [cursorDate]);

  const monthDays = useMemo(() => {
    const first = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1);
    const start = startOfWeek(first, 1);
    return Array.from({ length: 42 }, (_, index) => toDateKey(addDays(start, index)));
  }, [cursorDate]);

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => event.date >= toDateKey())
        .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
        .slice(0, 12),
    [events],
  );

  const openCreate = (date = cursor) => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      date,
      startTime: '',
      endTime: '',
      allDay: true,
      category: 'personal',
      location: '',
      meetingUrl: '',
      notes: '',
    });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      allDay: event.allDay,
      category: event.category,
      location: event.location || '',
      meetingUrl: event.meetingUrl || '',
      notes: event.notes || '',
    });
    setErrors({});
    setOpen(true);
  };

  const save = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const formElement = event?.currentTarget;
    const domTitle = formElement
      ? new FormData(formElement).get('title')?.toString() || form.title
      : form.title;
    const parsed = eventFormSchema.safeParse({
      ...form,
      title: domTitle,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      meetingUrl: form.meetingUrl || '',
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      toast.error('Revise os campos', next.title || next.date || next.meetingUrl || 'Dados inválidos');
      return;
    }
    if (editing) {
      updateEvent(editing.id, parsed.data);
      toast.success('Compromisso atualizado');
    } else {
      createEvent(parsed.data);
      toast.success('Compromisso criado');
    }
    setOpen(false);
  };

  const shift = (days: number) => {
    setCursor(toDateKey(addDays(cursorDate, days)));
  };

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agenda</h2>
          <p className="text-sm text-text-muted">Eventos e tarefas no mesmo calendário</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4" />
          Novo compromisso
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['day', 'week', 'month', 'list'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`rounded-md border px-3 py-2 text-xs font-semibold ${
              view === id ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-muted'
            }`}
          >
            {id === 'day' ? 'Dia' : id === 'week' ? 'Semana' : id === 'month' ? 'Mês' : 'Lista'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Anterior" onClick={() => shift(view === 'month' ? -30 : view === 'week' ? -7 : -1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(toDateKey())}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" aria-label="Próximo" onClick={() => shift(view === 'month' ? 30 : view === 'week' ? 7 : 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'day' || view === 'list' ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
            <h3 className="font-semibold">{formatDate(cursor, { weekday: 'long', day: '2-digit', month: 'long' })}</h3>
            {dayEvents.length === 0 && dayTasks.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Agenda livre"
                  description="Toque para criar um compromisso neste dia."
                  actionLabel="Criar compromisso"
                  onAction={() => openCreate(cursor)}
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {dayEvents.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      className="flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-border px-3 py-3 text-left hover:bg-surface-hover"
                    >
                      <span
                        className="mt-1 h-3 w-3 rounded-full"
                        style={{ background: EVENT_CATEGORY_COLORS[event.category] }}
                        aria-hidden
                      />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-text-muted">
                          {event.allDay || !event.startTime ? 'Dia todo' : `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}`}
                          {' · '}
                          {EVENT_CATEGORY_LABELS[event.category]}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
                {dayTasks.map((task) => (
                  <li key={task.id} className="rounded-[var(--radius-md)] border border-dashed border-border px-3 py-3 text-sm">
                    Tarefa: {task.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
            <h3 className="font-semibold">Próximos eventos</h3>
            <ul className="mt-3 space-y-2">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <button type="button" className="w-full text-left text-sm" onClick={() => openEdit(event)}>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-text-subtle">
                      {formatDate(event.date)}
                      {event.startTime ? ` · ${event.startTime}` : ''}
                    </p>
                  </button>
                </li>
              ))}
              {upcoming.length === 0 ? <li className="text-sm text-text-muted">Nenhum evento futuro.</li> : null}
            </ul>
            <p className="mt-4 text-xs text-text-subtle">
              Integração com Google Calendar estará disponível em Configurações → Integrações.
            </p>
          </section>
        </div>
      ) : null}

      {view === 'week' ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
          {weekDays.map((day) => {
            const items = events.filter((event) => event.date === day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => openCreate(day)}
                className={`min-h-28 rounded-[var(--radius-md)] border border-border p-2 text-left ${
                  day === cursor ? 'border-accent bg-accent-soft/40' : 'bg-bg-elevated/60'
                }`}
              >
                <p className="text-xs font-semibold">{formatDate(day, { weekday: 'short', day: '2-digit' })}</p>
                <ul className="mt-2 space-y-1">
                  {items.slice(0, 3).map((event) => (
                    <li key={event.id} className="truncate text-[11px]" style={{ color: EVENT_CATEGORY_COLORS[event.category] }}>
                      {event.title}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      ) : null}

      {view === 'month' ? (
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const inMonth = day.slice(0, 7) === cursor.slice(0, 7);
            const items = events.filter((event) => event.date === day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setCursor(day);
                  openCreate(day);
                }}
                className={`min-h-20 rounded-md border border-border p-1.5 text-left ${
                  inMonth ? 'bg-bg-elevated/70' : 'bg-bg-muted/40 text-text-subtle'
                } ${day === toDateKey() ? 'border-accent' : ''}`}
              >
                <p className="text-[11px] font-semibold">{day.slice(-2)}</p>
                {items.slice(0, 2).map((event) => (
                  <p key={event.id} className="truncate text-[10px]" style={{ color: EVENT_CATEGORY_COLORS[event.category] }}>
                    {event.title}
                  </p>
                ))}
              </button>
            );
          })}
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar compromisso' : 'Novo compromisso'}
        footer={
          <div className="flex justify-between gap-2">
            {editing ? (
              <Button type="button" variant="danger" onClick={() => setDeleteId(editing.id)}>
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" form="event-form">
                Salvar
              </Button>
            </div>
          </div>
        }
      >
        <form id="event-form" className="space-y-3" onSubmit={save}>
          <Input
            label="Título"
            name="title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            error={errors.title}
            required
          />
          <Input
            label="Data"
            name="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            error={errors.date}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Início"
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value, allDay: !e.target.value }))}
            />
            <Input
              label="Fim"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
            />
          </div>
          <Select
            label="Categoria"
            name="category"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as EventCategory }))}
            options={Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Input
            label="Local"
            name="location"
            value={form.location}
            onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          />
          <Input
            label="Link da reunião"
            name="meetingUrl"
            type="url"
            value={form.meetingUrl}
            onChange={(e) => setForm((p) => ({ ...p, meetingUrl: e.target.value }))}
            error={errors.meetingUrl}
          />
          <Textarea
            label="Observações"
            name="notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir compromisso?"
        description="O evento será removido da sua agenda."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteEvent(deleteId);
            toast.success('Compromisso excluído');
          }
          setDeleteId(null);
          setOpen(false);
        }}
      />
    </div>
  );
}
