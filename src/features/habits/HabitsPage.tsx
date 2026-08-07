import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { goalProgress, habitCompletionRate } from '../../lib/progress';
import { toDateKey, formatDate } from '../../lib/dates';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import type { HabitFrequency } from '../../types';

export function HabitsPage() {
  const toast = useToast();
  const {
    habits,
    habitEntries,
    goals,
    createHabit,
    toggleHabitToday,
    createGoal,
    updateGoal,
  } = useData();
  const [habitOpen, setHabitOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [habitForm, setHabitForm] = useState({
    title: '',
    description: '',
    frequency: 'daily' as HabitFrequency,
    notes: '',
  });
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    targetValue: '100',
    currentValue: '0',
    unit: '%',
    dueDate: '',
  });

  const today = toDateKey();

  const habitStats = useMemo(
    () =>
      habits
        .filter((habit) => !habit.archived)
        .map((habit) => {
          const entries = habitEntries.filter((entry) => entry.habitId === habit.id);
          const last30 = Array.from({ length: 30 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - index));
            return toDateKey(date);
          });
          const completed = last30.filter((date) =>
            entries.some((entry) => entry.date === date && entry.completed),
          ).length;
          const doneToday = entries.some((entry) => entry.date === today && entry.completed);
          return {
            habit,
            doneToday,
            rate: habitCompletionRate(completed, 30),
          };
        }),
    [habits, habitEntries, today],
  );

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Hábitos e metas</h2>
          <p className="text-sm text-text-muted">Consistência sem culpa — um toque para registrar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setGoalOpen(true)}>Nova meta</Button>
          <Button onClick={() => setHabitOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo hábito
          </Button>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Hábitos de hoje</h3>
        {habitStats.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="Nenhum hábito"
              description="Crie hábitos diários ou semanais para acompanhar sua rotina."
              actionLabel="Criar hábito"
              onAction={() => setHabitOpen(true)}
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {habitStats.map(({ habit, doneToday, rate }) => (
              <li key={habit.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggleHabitToday(habit.id);
                    toast.success(doneToday ? 'Registro removido' : 'Hábito registrado');
                  }}
                  className={`flex min-h-20 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left transition touch-target ${
                    doneToday
                      ? 'border-accent bg-accent-soft'
                      : 'border-border bg-bg hover:bg-surface-hover'
                  }`}
                  aria-pressed={doneToday}
                >
                  <div>
                    <p className="font-semibold">{habit.title}</p>
                    <p className="text-xs text-text-subtle">
                      Sequência {habit.currentStreak} · melhor {habit.bestStreak} · {rate}% em 30 dias
                    </p>
                  </div>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                      doneToday ? 'border-accent bg-accent text-accent-fg' : 'border-border'
                    }`}
                    aria-hidden
                  >
                    {doneToday ? '✓' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Metas pessoais</h3>
        {goals.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">Nenhuma meta cadastrada.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {goals.map((goal) => {
              const progress = goalProgress(goal.currentValue, goal.targetValue);
              return (
                <li key={goal.id} className="rounded-[var(--radius-md)] border border-border px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-xs text-text-subtle">
                        {goal.currentValue}/{goal.targetValue} {goal.unit}
                        {goal.dueDate ? ` · até ${formatDate(goal.dueDate)}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const next = Math.min(goal.targetValue, goal.currentValue + 1);
                        updateGoal(goal.id, {
                          currentValue: next,
                          status: next >= goal.targetValue ? 'completed' : goal.status,
                        });
                        toast.success('Progresso atualizado');
                      }}
                    >
                      +1
                    </Button>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-muted">
                    <div className="h-full rounded-full bg-info" style={{ width: `${progress}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        open={habitOpen}
        onClose={() => setHabitOpen(false)}
        title="Novo hábito"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setHabitOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!habitForm.title.trim()) return;
                createHabit(habitForm);
                toast.success('Hábito criado');
                setHabitOpen(false);
                setHabitForm({ title: '', description: '', frequency: 'daily', notes: '' });
              }}
            >
              Criar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Título" value={habitForm.title} onChange={(e) => setHabitForm((p) => ({ ...p, title: e.target.value }))} required />
          <Textarea label="Descrição" value={habitForm.description} onChange={(e) => setHabitForm((p) => ({ ...p, description: e.target.value }))} />
          <Select
            label="Frequência"
            value={habitForm.frequency}
            onChange={(e) => setHabitForm((p) => ({ ...p, frequency: e.target.value as HabitFrequency }))}
            options={[
              { value: 'daily', label: 'Diária' },
              { value: 'weekly', label: 'Semanal' },
            ]}
          />
          <Textarea label="Observações" value={habitForm.notes} onChange={(e) => setHabitForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title="Nova meta"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setGoalOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!goalForm.title.trim()) return;
                createGoal({
                  title: goalForm.title,
                  description: goalForm.description,
                  targetValue: Number(goalForm.targetValue) || 100,
                  currentValue: Number(goalForm.currentValue) || 0,
                  unit: goalForm.unit,
                  dueDate: goalForm.dueDate || null,
                });
                toast.success('Meta criada');
                setGoalOpen(false);
              }}
            >
              Criar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Título" value={goalForm.title} onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))} required />
          <Textarea label="Descrição" value={goalForm.description} onChange={(e) => setGoalForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Atual" inputMode="decimal" value={goalForm.currentValue} onChange={(e) => setGoalForm((p) => ({ ...p, currentValue: e.target.value }))} />
            <Input label="Alvo" inputMode="decimal" value={goalForm.targetValue} onChange={(e) => setGoalForm((p) => ({ ...p, targetValue: e.target.value }))} />
            <Input label="Unidade" value={goalForm.unit} onChange={(e) => setGoalForm((p) => ({ ...p, unit: e.target.value }))} />
          </div>
          <Input label="Prazo" type="date" value={goalForm.dueDate} onChange={(e) => setGoalForm((p) => ({ ...p, dueDate: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
