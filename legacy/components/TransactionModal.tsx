import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import {
  FinanceTransaction,
  FinanceCategory,
  FinanceTransactionType,
  FinanceTransactionStatus,
} from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<FinanceTransaction, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  transaction: FinanceTransaction | null;
}

const CATEGORIES: FinanceCategory[] = [
  'Aluguel',
  'Energia',
  'Mercado',
  'SaaS Subscriptions',
  'Receitas de Projetos',
  'Hardware',
  'Software',
  'Outros',
];

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  transaction,
}) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FinanceCategory>('Outros');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<FinanceTransactionType>('expense');
  const [context, setContext] = useState<'pessoal' | 'business'>('pessoal');
  const [status, setStatus] = useState<FinanceTransactionStatus>('pending');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setCategory(transaction.category);
      setDueDate(transaction.dueDate);
      setAmount(String(transaction.amount));
      setType(transaction.type);
      setContext(transaction.context);
      setStatus(transaction.status);
    } else {
      setDescription('');
      setCategory('Outros');
      setDueDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setType('expense');
      setContext('pessoal');
      setStatus('pending');
    }
  }, [transaction, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(/,/g, '.').replace(/\s/g, ''));
    if (!description.trim() || isNaN(num) || num <= 0 || !dueDate) return;
    onSave({
      description: description.trim(),
      category,
      dueDate,
      amount: num,
      currency: 'BRL',
      type,
      status,
      context,
    });
  };

  const inputClass =
    'w-full px-4 py-3 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all font-mono';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-neutral-900 border-2 border-neutral-800 shadow-2xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">
                {transaction ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aluguel, Vercel Pro..."
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FinanceTransactionType)}
                    className={inputClass}
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">Contexto</label>
                  <select
                    value={context}
                    onChange={(e) => setContext(e.target.value as 'pessoal' | 'business')}
                    className={inputClass}
                  >
                    <option value="pessoal">Pessoal</option>
                    <option value="business">Business / WillTech</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FinanceCategory)}
                  className={inputClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">Vencimento *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">Valor (BRL) *</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FinanceTransactionStatus)}
                  className={inputClass}
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                  <option value="received">Recebido</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar
                </button>
                {transaction && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta transação?')) {
                        onDelete(transaction.id);
                        onClose();
                      }
                    }}
                    className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-neutral-800 text-neutral-400 rounded-xl font-bold hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;
