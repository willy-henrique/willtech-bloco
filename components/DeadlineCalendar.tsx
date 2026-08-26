import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bookmark, Calendar, DollarSign, Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../AppContext';
import { ContractDeadline, ProjectPayment } from '../types';
import { projectPaymentsService } from '../src/services/firestoreService';

interface DeadlineCalendarProps { compact?: boolean }

const emptyForm = { title: '', date: '', projectId: '', type: 'Sprint' as ContractDeadline['type'] };
const localDate = (value: string) => new Date(`${value}T12:00:00`);
const startOfToday = () => {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
};

const DeadlineCalendar: React.FC<DeadlineCalendarProps> = ({ compact = false }) => {
  const { deadlines, projects, addDeadline, updateDeadline, deleteDeadline } = useApp();
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'payments'>('lifecycle');
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const orderedDeadlines = useMemo(
    () => [...deadlines].sort((first, second) => localDate(first.date).getTime() - localDate(second.date).getTime()),
    [deadlines],
  );

  useEffect(() => {
    if (activeTab !== 'payments') return;
    let active = true;
    setIsLoadingPayments(true);
    Promise.allSettled(projects.map((project) => projectPaymentsService.getByProjectId(project.id)))
      .then((results) => {
        if (!active) return;
        const loaded = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
        setPayments(loaded.sort((a, b) => localDate(a.dueDate).getTime() - localDate(b.dueDate).getTime()));
        if (results.some((result) => result.status === 'rejected')) {
          setActionError('Alguns pagamentos nao puderam ser sincronizados.');
        }
      })
      .finally(() => active && setIsLoadingPayments(false));
    return () => { active = false; };
  }, [activeTab, projects]);

  const dateInfo = (value: string) => {
    const date = localDate(value);
    return { date, month: date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(), day: date.getDate() };
  };
  const daysUntil = (date: Date) => Math.ceil((date.getTime() - startOfToday().getTime()) / 86_400_000);
  const isUrgent = (date: Date) => daysUntil(date) >= 0 && daysUntil(date) <= 7;
  const isOverdue = (date: Date) => daysUntil(date) < 0;

  const resetForm = () => {
    setForm({ ...emptyForm, projectId: projects[0]?.id || '' });
    setEditingId(null);
    setIsFormOpen(false);
    setActionError(null);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, projectId: projects[0]?.id || '' });
    setEditingId(null);
    setActionError(null);
    setIsFormOpen(true);
  };

  const openEdit = (deadline: ContractDeadline) => {
    setForm({ title: deadline.title, date: deadline.date, projectId: deadline.projectId, type: deadline.type });
    setEditingId(deadline.id);
    setActionError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.projectId) return;
    setIsSaving(true);
    setActionError(null);
    try {
      const payload = { ...form, title: form.title.trim() };
      if (editingId) await updateDeadline(editingId, payload);
      else await addDeadline(payload);
      resetForm();
    } catch {
      setActionError('O marco nao foi salvo. Revise a conexao e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (deadline: ContractDeadline) => {
    if (!confirm(`Excluir o marco "${deadline.title}"?`)) return;
    setActionError(null);
    try {
      await deleteDeadline(deadline.id);
    } catch {
      setActionError('O marco nao foi excluido. Tente novamente.');
    }
  };

  if (compact) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-600">Proximos marcos</p><h3 className="mt-1 text-sm font-semibold text-neutral-200">Agenda</h3></div>
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-emerald-300/70"><Calendar size={14} /></div>
        </div>
        <div className="space-y-2">
          {orderedDeadlines.slice(0, 3).map((deadline) => {
            const info = dateInfo(deadline.date);
            const danger = isOverdue(info.date) || isUrgent(info.date);
            const project = projects.find((item) => item.id === deadline.projectId);
            return <div key={deadline.id} className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-black/10 p-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-center ${danger ? 'border-rose-400/15 bg-rose-400/[0.07] text-rose-300' : 'border-white/[0.07] bg-white/[0.03] text-neutral-300'}`}>
                <div><span className="block text-[7px] font-semibold leading-none">{info.month}</span><span className="mt-0.5 block text-sm font-semibold leading-none">{info.day}</span></div>
              </div>
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-neutral-300">{deadline.title}</p><p className="mt-1 truncate text-[9px] uppercase tracking-[0.1em] text-neutral-700">{project?.name || deadline.projectId} · {deadline.type}</p></div>
              {danger && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />}
            </div>;
          })}
          {!orderedDeadlines.length && <div className="rounded-xl border border-dashed border-white/[0.07] py-7 text-center text-[11px] text-neutral-600">Nenhum marco agendado.</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setActiveTab('lifecycle')} className={`border-b-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'lifecycle' ? 'border-lime-500 text-white' : 'border-transparent text-neutral-500'}`}><span className="flex items-center gap-2"><Calendar size={14} /> Agenda</span></button>
          <button type="button" onClick={() => setActiveTab('payments')} className={`border-b-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'payments' ? 'border-red-500 text-red-400' : 'border-transparent text-neutral-500'}`}><span className="flex items-center gap-2"><DollarSign size={14} /> Pagamentos</span></button>
        </div>
        {activeTab === 'lifecycle' && <button type="button" onClick={openCreate} className="mb-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-300 px-2.5 py-1.5 text-[10px] font-bold text-[#07110c]"><Plus size={13} /> Novo marco</button>}
      </div>

      {actionError && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">{actionError}</p>}

      <AnimatePresence>
        {isFormOpen && activeTab === 'lifecycle' && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="space-y-3 overflow-hidden rounded-xl border border-white/[0.08] bg-black/20 p-4">
            <div className="flex items-center justify-between"><h4 className="text-xs font-semibold text-white">{editingId ? 'Editar marco' : 'Novo marco'}</h4><button type="button" onClick={resetForm} aria-label="Fechar formulario"><X size={15} /></button></div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Titulo<input aria-label="Titulo do marco" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs normal-case text-white outline-none focus:border-emerald-400/40" required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Data<input aria-label="Data do marco" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white" required /></label>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Tipo<select aria-label="Tipo do marco" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ContractDeadline['type'] })} className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white"><option>Contract</option><option>Sprint</option><option>Payment</option></select></label>
            </div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Projeto<select aria-label="Projeto do marco" value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-xs text-white" required><option value="">Selecione...</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime-500 py-2.5 text-xs font-bold text-black disabled:opacity-60"><Save size={14} /> {isSaving ? 'Salvando...' : 'Salvar marco'}</button>
          </motion.form>
        )}
      </AnimatePresence>

      {activeTab === 'lifecycle' ? (
        <div className="space-y-2">
          {orderedDeadlines.map((deadline) => {
            const info = dateInfo(deadline.date);
            const overdue = isOverdue(info.date);
            const urgent = isUrgent(info.date);
            const project = projects.find((item) => item.id === deadline.projectId);
            return <motion.div key={deadline.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border ${overdue || urgent ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-neutral-700 text-white'}`}><span className="text-[8px] font-bold">{info.month}</span><span className="font-mono text-lg font-black">{info.day}</span></div>
              <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-bold text-white">{deadline.title}</h4>{(urgent || overdue) && <AlertCircle size={14} className="shrink-0 text-red-500" />}</div><div className="mt-2 flex flex-wrap items-center gap-2"><span className="rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-1 text-[9px] font-bold text-neutral-300">{project?.name || deadline.projectId}</span><span className="flex items-center gap-1 text-[9px] text-neutral-500"><Bookmark size={10} /> {deadline.type}</span></div></div>
              <div className="flex shrink-0 items-start gap-1"><button type="button" onClick={() => openEdit(deadline)} aria-label={`Editar ${deadline.title}`} className="rounded-lg p-2 text-neutral-600 hover:bg-white/5 hover:text-white"><Edit3 size={13} /></button><button type="button" onClick={() => handleDelete(deadline)} aria-label={`Excluir ${deadline.title}`} className="rounded-lg p-2 text-neutral-600 hover:bg-red-400/10 hover:text-red-400"><Trash2 size={13} /></button></div>
            </motion.div>;
          })}
          {!orderedDeadlines.length && <div className="rounded-xl border border-dashed border-neutral-800 py-8 text-center text-xs text-neutral-600">Nenhum marco cadastrado</div>}
        </div>
      ) : (
        <div className="space-y-2">
          {isLoadingPayments ? <div className="py-8 text-center text-xs text-neutral-600">Carregando pagamentos...</div> : payments.map((payment) => {
            const info = dateInfo(payment.dueDate);
            const status = payment.status === 'paid' ? 'paid' : isOverdue(info.date) ? 'overdue' : isUrgent(info.date) ? 'urgent' : 'pending';
            const project = projects.find((item) => item.id === payment.projectId);
            return <div key={payment.id} className={`flex gap-3 rounded-xl border p-3 ${status === 'overdue' ? 'border-red-500/40 bg-red-500/10' : status === 'paid' ? 'border-green-500/30 bg-green-500/10' : 'border-neutral-800 bg-neutral-950/60'}`}><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-neutral-700"><span className="text-[8px]">{info.month}</span><span className="font-mono text-lg font-black">{info.day}</span></div><div className="min-w-0 flex-1"><h4 className="text-sm font-bold text-white">{payment.title}</h4><p className="mt-1 text-[10px] text-neutral-500">{project?.name || payment.projectId} · {status.toUpperCase()}</p>{payment.amount != null && <p className="mt-1 text-xs text-neutral-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: payment.currency || 'BRL' }).format(payment.amount)}</p>}</div></div>;
          })}
          {!isLoadingPayments && !payments.length && <div className="rounded-xl border border-dashed border-neutral-800 py-8 text-center text-xs text-neutral-600">Nenhum pagamento cadastrado</div>}
        </div>
      )}
    </div>
  );
};

export default DeadlineCalendar;
