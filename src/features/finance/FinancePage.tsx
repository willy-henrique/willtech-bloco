import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatBRL } from '../../lib/currency';
import { toDateKey, formatDate } from '../../lib/dates';
import { transactionFormSchema } from '../../schemas/finance';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import type { Transaction, TransactionStatus, TransactionType } from '../../types';

export function FinancePage() {
  const toast = useToast();
  const {
    transactions,
    categories,
    accounts,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: '',
    type: 'expense' as TransactionType,
    amount: '',
    categoryId: '',
    accountId: '',
    toAccountId: '',
    paymentMethod: '',
    dueDate: toDateKey(),
    status: 'pending' as TransactionStatus,
    notes: '',
    recurring: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const monthKey = toDateKey().slice(0, 7);

  const stats = useMemo(() => {
    const monthTx = transactions.filter((tx) => tx.dueDate.startsWith(monthKey));
    const income = monthTx
      .filter((tx) => tx.type === 'income' && tx.status !== 'cancelled')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthTx
      .filter((tx) => tx.type === 'expense' && tx.status !== 'cancelled')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const balance = accounts.reduce((sum, account) => sum + account.balance, 0) + income - expense;
    const dueSoon = transactions
      .filter((tx) => tx.status === 'pending' && tx.dueDate >= toDateKey())
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 6);

    const byCategory = categories
      .map((category) => ({
        category,
        total: monthTx
          .filter((tx) => tx.categoryId === category.id && tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0),
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const evolution = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthItems = transactions.filter((tx) => tx.dueDate.startsWith(key));
      return {
        key,
        label: date.toLocaleDateString('pt-BR', { month: 'short' }),
        income: monthItems.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        expense: monthItems.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
      };
    });

    return { income, expense, result: income - expense, balance, dueSoon, byCategory, evolution };
  }, [transactions, accounts, categories, monthKey]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      description: '',
      type: 'expense',
      amount: '',
      categoryId: categories[0]?.id || '',
      accountId: accounts[0]?.id || '',
      toAccountId: '',
      paymentMethod: '',
      dueDate: toDateKey(),
      status: 'pending',
      notes: '',
      recurring: false,
    });
    setErrors({});
    setOpen(true);
  };

  const save = () => {
    const parsed = transactionFormSchema.safeParse({
      ...form,
      amount: Number(form.amount.replace(',', '.')),
      categoryId: form.categoryId || null,
      accountId: form.accountId || null,
      toAccountId: form.toAccountId || null,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      return;
    }
    if (editing) {
      updateTransaction(editing.id, parsed.data);
      toast.success('Transação atualizada');
    } else {
      createTransaction(parsed.data);
      toast.success('Transação registrada');
    }
    setOpen(false);
  };

  const maxEvolution = Math.max(
    1,
    ...stats.evolution.flatMap((item) => [item.income, item.expense]),
  );

  return (
    <div className="space-y-4 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Finanças</h2>
          <p className="text-sm text-text-muted">Controle em Real (pt-BR · America/Sao_Paulo)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova transação
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Saldo atual</p>
          <p className="mt-2 text-xl font-bold">{formatBRL(stats.balance)}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Receitas do mês</p>
          <p className="mt-2 text-xl font-bold text-success">{formatBRL(stats.income)}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Despesas do mês</p>
          <p className="mt-2 text-xl font-bold text-danger">{formatBRL(stats.expense)}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-text-subtle">Resultado mensal</p>
          <p className={`mt-2 text-xl font-bold ${stats.result >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatBRL(stats.result)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <h3 className="font-semibold">Gastos por categoria</h3>
          {stats.byCategory.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">Sem despesas categorizadas neste mês.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {stats.byCategory.map((item) => (
                <li key={item.category.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{item.category.name}</span>
                    <span>{formatBRL(item.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((item.total / (stats.expense || 1)) * 100)}%`,
                        background: item.category.color,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
          <h3 className="font-semibold">Evolução mensal</h3>
          <div className="mt-4 flex h-40 items-end gap-2">
            {stats.evolution.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-2 rounded-t bg-success"
                    style={{ height: `${(item.income / maxEvolution) * 100}%` }}
                    title={`Receitas ${formatBRL(item.income)}`}
                  />
                  <div
                    className="w-2 rounded-t bg-danger"
                    style={{ height: `${(item.expense / maxEvolution) * 100}%` }}
                    title={`Despesas ${formatBRL(item.expense)}`}
                  />
                </div>
                <span className="text-[10px] uppercase text-text-subtle">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="font-semibold">Contas a vencer</h3>
        {stats.dueSoon.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">Nenhuma conta pendente.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.dueSoon.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-text-subtle">{formatDate(tx.dueDate)}</p>
                </div>
                <span className="font-semibold">{formatBRL(tx.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated/70 p-4">
        <h3 className="mb-3 font-semibold">Transações</h3>
        {transactions.length === 0 ? (
          <EmptyState
            title="Nenhuma transação"
            description="Registre receitas, despesas e transferências."
            actionLabel="Nova transação"
            onAction={openCreate}
          />
        ) : (
          <ul className="space-y-2">
            {transactions
              .slice()
              .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
              .map((tx) => (
                <li key={tx.id} className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setEditing(tx);
                      setForm({
                        description: tx.description,
                        type: tx.type,
                        amount: String(tx.amount),
                        categoryId: tx.categoryId || '',
                        accountId: tx.accountId || '',
                        toAccountId: tx.toAccountId || '',
                        paymentMethod: tx.paymentMethod || '',
                        dueDate: tx.dueDate,
                        status: tx.status,
                        notes: tx.notes || '',
                        recurring: tx.recurring,
                      });
                      setOpen(true);
                    }}
                  >
                    <p className="font-medium">{tx.description}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge tone={tx.type === 'income' ? 'success' : tx.type === 'expense' ? 'danger' : 'info'}>
                        {tx.type}
                      </Badge>
                      <Badge>{tx.status}</Badge>
                      <span className="text-xs text-text-subtle">{formatDate(tx.dueDate)}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatBRL(tx.amount)}</span>
                    {tx.status === 'pending' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          updateTransaction(tx.id, { status: 'paid', paidAt: Date.now() });
                          toast.success('Marcada como paga');
                        }}
                      >
                        Pagar
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(tx.id)}>
                      Excluir
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar transação' : 'Nova transação'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Descrição" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} error={errors.description} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as TransactionType }))}
              options={[
                { value: 'income', label: 'Receita' },
                { value: 'expense', label: 'Despesa' },
                { value: 'transfer', label: 'Transferência' },
              ]}
            />
            <Input label="Valor" inputMode="decimal" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} error={errors.amount} required />
            <Input label="Vencimento" type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} required />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TransactionStatus }))}
              options={[
                { value: 'pending', label: 'Pendente' },
                { value: 'paid', label: 'Pago' },
                { value: 'overdue', label: 'Atrasado' },
                { value: 'cancelled', label: 'Cancelado' },
              ]}
            />
            <Select
              label="Categoria"
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              options={[{ value: '', label: 'Sem categoria' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select
              label="Conta"
              value={form.accountId}
              onChange={(e) => setForm((p) => ({ ...p, accountId: e.target.value }))}
              options={[{ value: '', label: 'Sem conta' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
            />
          </div>
          {form.type === 'transfer' ? (
            <Select
              label="Conta destino"
              value={form.toAccountId}
              onChange={(e) => setForm((p) => ({ ...p, toAccountId: e.target.value }))}
              error={errors.toAccountId}
              options={[{ value: '', label: 'Selecione' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
            />
          ) : null}
          <Input label="Forma de pagamento" value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))} />
          <Textarea label="Observações" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm((p) => ({ ...p, recurring: e.target.checked }))}
            />
            Transação recorrente
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Excluir transação?"
        description="A transação será removida do seu histórico financeiro."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteTransaction(deleteId);
            toast.success('Transação excluída');
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
}
