import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Wallet,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  Edit3,
} from 'lucide-react';
import {
  FinanceTransaction,
  FinanceTransactionStatus,
  FinanceCategory,
  FinanceGoal,
  CashFlowPoint,
} from '../types';
import TransactionModal from './TransactionModal';
import GoalModal from './GoalModal';

// Storage keys
const STORAGE_KEYS = {
  transactions: 'willtech_finance_transactions',
  goals: 'willtech_finance_goals',
  categories: 'willtech_finance_categories',
};

// Default categories
const DEFAULT_CATEGORIES: FinanceCategory[] = [
  'Aluguel',
  'Energia',
  'Mercado',
  'SaaS Subscriptions',
  'Receitas de Projetos',
  'Hardware',
  'Software',
  'Outros',
];

// Initial mock data - used only on first load
const INITIAL_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: '1',
    description: 'Aluguel',
    category: 'Aluguel',
    dueDate: '2026-01-05',
    amount: 2500,
    currency: 'BRL',
    type: 'expense',
    status: 'paid',
    context: 'pessoal',
    createdAt: Date.now() - 86400000 * 20,
    paidAt: Date.now() - 86400000 * 2,
  },
];

const INITIAL_GOALS: FinanceGoal[] = [
  { id: '1', title: 'Reserva de Emergência', targetAmount: 30000, currentAmount: 18500, currency: 'BRL', createdAt: Date.now() },
  { id: '2', title: 'Novo Hardware', targetAmount: 8000, currentAmount: 3200, currency: 'BRL', createdAt: Date.now() },
];

const CATEGORY_COLORS: Record<string, string> = {
  Aluguel: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  Energia: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Mercado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'SaaS Subscriptions': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Receitas de Projetos': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  Hardware: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Software: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Outros: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
};

const STATUS_CONFIG: Record<FinanceTransactionStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  paid: { label: 'Pago', className: 'bg-lime-500/20 text-lime-400 border-lime-500/30', icon: CheckCircle2 },
  overdue: { label: 'Atrasado', className: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle },
  received: { label: 'Recebido', className: 'bg-lime-500/20 text-lime-400 border-lime-500/30', icon: CheckCircle2 },
};

// Helper functions for localStorage
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const FinanceHub: React.FC = () => {
  // State with localStorage persistence
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS)
  );
  const [goals, setGoals] = useState<FinanceGoal[]>(() =>
    loadFromStorage(STORAGE_KEYS.goals, INITIAL_GOALS)
  );
  const [customCategories, setCustomCategories] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.categories, [])
  );

  const [accountTab, setAccountTab] = useState<'pessoal' | 'business'>('pessoal');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinanceGoal | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.transactions, transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.goals, goals);
  }, [goals]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.categories, customCategories);
  }, [customCategories]);

  // All categories (default + custom)
  const allCategories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => t.context === accountTab),
    [transactions, accountTab]
  );

  const { totalBalance, pendingBalance, projectedBalance, receivables30, payablesTodayTomorrow } = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    const in30Days = new Date(now.getTime() + 30 * 86400000);

    let liquidated = 0;
    let pending = 0;
    let receivables = 0;
    let payables = 0;

    transactions.forEach((t) => {
      const due = new Date(t.dueDate);
      if (t.type === 'income') {
        if (t.status === 'received') {
          liquidated += t.amount;
        } else if (t.status === 'pending' || t.status === 'overdue') {
          pending += t.amount;
          if (due <= in30Days && due >= now) receivables += t.amount;
        }
      } else {
        if (t.status === 'paid') {
          liquidated -= t.amount;
        } else if (t.status === 'pending' || t.status === 'overdue') {
          pending -= t.amount;
          if (t.dueDate === today || t.dueDate === tomorrow) payables += t.amount;
        }
      }
    });

    return {
      totalBalance: liquidated,
      pendingBalance: pending,
      projectedBalance: liquidated + pending,
      receivables30: receivables,
      payablesTodayTomorrow: payables,
    };
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense' && t.status === 'paid')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [transactions]);

  const donutTotal = useMemo(() => Object.values(categoryTotals).reduce((a, b) => a + b, 0), [categoryTotals]);

  // Calculate cash flow from actual transactions
  const cashFlowData = useMemo(() => {
    const months: CashFlowPoint[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM

      let inflows = 0;
      let outflows = 0;

      transactions.forEach((t) => {
        if (t.dueDate.startsWith(monthStr)) {
          if (t.type === 'income' && t.status === 'received') {
            inflows += t.amount;
          } else if (t.type === 'expense' && t.status === 'paid') {
            outflows += t.amount;
          }
        }
      });

      months.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), inflows, outflows });
    }

    return months;
  }, [transactions]);

  const formatCurrency = (value: number, currency = 'BRL') =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  // Transaction handlers
  const handleSaveTransaction = (data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTransaction.id ? { ...t, ...data } : t))
      );
    } else {
      setTransactions((prev) => [
        ...prev,
        {
          ...data,
          id: String(Date.now()),
          createdAt: Date.now(),
        },
      ]);
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Quick action: mark as paid/received
  const handleQuickStatusChange = (transaction: FinanceTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus: FinanceTransactionStatus =
      transaction.type === 'income'
        ? transaction.status === 'received' ? 'pending' : 'received'
        : transaction.status === 'paid' ? 'pending' : 'paid';

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transaction.id
          ? { ...t, status: newStatus, paidAt: newStatus === 'paid' || newStatus === 'received' ? Date.now() : undefined }
          : t
      )
    );
  };

  // Goal handlers
  const handleSaveGoal = (data: Omit<FinanceGoal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      setGoals((prev) =>
        prev.map((g) => (g.id === editingGoal.id ? { ...g, ...data } : g))
      );
    } else {
      setGoals((prev) => [
        ...prev,
        {
          ...data,
          id: String(Date.now()),
          createdAt: Date.now(),
        },
      ]);
    }
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Category handler
  const handleAddCategory = () => {
    if (newCategoryName.trim() && !allCategories.includes(newCategoryName.trim())) {
      setCustomCategories((prev) => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    }
  };

  const maxFlow = Math.max(
    ...cashFlowData.flatMap((p) => [p.inflows, p.outflows]),
    1
  );

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Wallet className="text-lime-500" size={28} />
            Finance Hub
          </h1>
          <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider mt-1">
            Controle Financeiro • Will Tech
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsTransactionModalOpen(true);
          }}
          className="px-4 py-2.5 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-all hover:scale-105 shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      {/* Zona A - Visão Geral de Liquidez */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_10px_#84cc16]" />
          Visão Geral de Liquidez
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-lime-500" />
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Liquidado</span>
            </div>
            <p className={`text-2xl font-mono font-black ${totalBalance >= 0 ? 'text-lime-400' : 'text-rose-400'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-amber-500" />
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Pendente</span>
            </div>
            <p className={`text-2xl font-mono font-black ${pendingBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {formatCurrency(pendingBalance)}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-cyan-500" />
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">Projetado</span>
            </div>
            <p className={`text-2xl font-mono font-black ${projectedBalance >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {formatCurrency(projectedBalance)}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-green-500" />
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">A Receber (30d)</span>
            </div>
            <p className="text-2xl font-mono font-black text-green-400">{formatCurrency(receivables30)}</p>
          </div>
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={18} className="text-rose-400" />
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-wider">A Pagar (Hoje/Amanhã)</span>
            </div>
            <p className="text-2xl font-mono font-black text-rose-400">{formatCurrency(payablesTodayTomorrow)}</p>
          </div>
        </div>

        {/* Line Chart - Fluxo de Caixa */}
        <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
          <h3 className="text-sm font-bold text-neutral-300 mb-4">Fluxo de Caixa • Últimos 6 meses</h3>
          <div className="flex items-end gap-2 h-40">
            {cashFlowData.map((point) => (
              <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end justify-center h-32">
                  <div
                    className="w-1/2 rounded-t bg-lime-500/60 min-h-[4px] transition-all hover:bg-lime-500/80"
                    style={{ height: `${(point.inflows / maxFlow) * 100}%` }}
                    title={`Entradas: ${formatCurrency(point.inflows)}`}
                  />
                  <div
                    className="w-1/2 rounded-t bg-rose-500/60 min-h-[4px] transition-all hover:bg-rose-500/80"
                    style={{ height: `${(point.outflows / maxFlow) * 100}%` }}
                    title={`Saídas: ${formatCurrency(point.outflows)}`}
                  />
                </div>
                <span className="text-[10px] font-mono text-neutral-500">{point.month}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded bg-lime-500/60" /> Entradas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded bg-rose-500/60" /> Saídas
            </span>
          </div>
        </div>
      </motion.section>

      {/* Zona B - Gestão de Contas */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_10px_#84cc16]" />
            Gestão de Contas
          </h2>
          {/* Add Category Button */}
          <div className="flex items-center gap-2">
            {showNewCategoryInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Nova categoria..."
                  className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-lime-500"
                  autoFocus
                />
                <button
                  onClick={handleAddCategory}
                  className="p-1.5 bg-lime-500 text-black rounded-lg hover:bg-lime-400"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setShowNewCategoryInput(false)}
                  className="p-1.5 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewCategoryInput(true)}
                className="text-xs text-neutral-500 hover:text-lime-400 transition-colors"
              >
                + Nova Categoria
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5 overflow-hidden">
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setAccountTab('pessoal')}
              className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                accountTab === 'pessoal'
                  ? 'bg-lime-500/20 text-lime-400 border-b-2 border-lime-500'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Pessoal
            </button>
            <button
              onClick={() => setAccountTab('business')}
              className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
                accountTab === 'business'
                  ? 'bg-lime-500/20 text-lime-400 border-b-2 border-lime-500'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Business / WillTech
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4 text-right font-mono">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const statusConf = STATUS_CONFIG[t.status];
                  const StatusIcon = statusConf.icon;
                  const isPaidOrReceived = t.status === 'paid' || t.status === 'received';
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="p-4 font-medium text-white">{t.description}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold border ${getCategoryColor(t.category)}`}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-400 font-mono text-sm flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(t.dueDate)}
                      </td>
                      <td
                        className={`p-4 text-right font-mono font-bold ${
                          t.type === 'income' ? 'text-lime-400' : 'text-rose-400'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, t.currency)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${statusConf.className}`}
                        >
                          <StatusIcon size={12} />
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {/* Quick action button */}
                          <button
                            onClick={(e) => handleQuickStatusChange(t, e)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isPaidOrReceived
                                ? 'bg-lime-500/20 text-lime-400 hover:bg-lime-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                            }`}
                            title={isPaidOrReceived ? 'Marcar como pendente' : (t.type === 'income' ? 'Marcar como recebido' : 'Marcar como pago')}
                          >
                            <Check size={14} />
                          </button>
                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingTransaction(t);
                              setIsTransactionModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                            title="Editar transação"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center text-neutral-500 text-sm">
              Nenhuma transação nesta categoria. Clique em &quot;Nova Transação&quot; para adicionar.
            </div>
          )}
        </div>
      </motion.section>

      {/* Zona C - Inteligência Financeira */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
          <h3 className="text-sm font-bold text-neutral-300 mb-4">Distribuição de Gastos por Categoria</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div
              className="w-40 h-40 rounded-full border-4 border-neutral-800 flex items-center justify-center font-mono text-lg font-black text-white"
                style={{
                  background: donutTotal
                    ? `conic-gradient(${Object.entries(categoryTotals)
                        .reduce<{ acc: number; parts: string[] }>(
                          (prev, [cat], i) => {
                            const colors = [
                              '#84cc16',
                              '#f43f5e',
                              '#eab308',
                              '#3b82f6',
                              '#8b5cf6',
                              '#06b6d4',
                              '#f97316',
                              '#64748b',
                            ];
                            const pct = (categoryTotals[cat] / donutTotal) * 100;
                            const start = prev.acc;
                            const end = prev.acc + pct;
                            prev.acc = end;
                            prev.parts.push(`${colors[i % colors.length]} ${start}% ${end}%`);
                            return prev;
                          },
                          { acc: 0, parts: [] }
                        )
                        .parts.join(', ')})`
                  : 'transparent',
              }}
            >
              <span className="bg-neutral-900 rounded-full w-24 h-24 flex items-center justify-center text-lime-400 font-mono text-sm">
                {donutTotal ? formatCurrency(donutTotal) : '—'}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {Object.entries(categoryTotals).map(([cat, value]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">{cat}</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-inner ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
              <Target size={16} className="text-lime-500" />
              Metas
            </h3>
            <button
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              className="p-1.5 rounded-lg bg-lime-500/20 text-lime-400 hover:bg-lime-500/30 transition-colors"
              title="Nova meta"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {goals.map((g) => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              return (
                <div
                  key={g.id}
                  className="space-y-2 p-3 rounded-xl bg-neutral-800/30 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  onClick={() => {
                    setEditingGoal(g);
                    setIsGoalModalOpen(true);
                  }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-medium flex items-center gap-2">
                      {g.title}
                      <Edit3 size={12} className="text-neutral-500" />
                    </span>
                    <span className="font-mono text-lime-400">
                      {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-lime-600 to-lime-400 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>{pct.toFixed(0)}% concluído</span>
                    {g.deadline && <span>Prazo: {formatDate(g.deadline)}</span>}
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="text-center text-neutral-500 text-sm py-4">
                Nenhuma meta. Clique em + para adicionar.
              </div>
            )}
          </div>
        </div>
      </motion.section>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        transaction={editingTransaction}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        onDelete={handleDeleteGoal}
        goal={editingGoal}
      />
    </div>
  );
};

export default FinanceHub;
