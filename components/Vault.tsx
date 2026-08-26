import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Braces,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileKey2,
  KeyRound,
  LockKeyhole,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { VaultCategory } from '../types';

interface VaultProps {
  expanded?: boolean;
}

const CATEGORIES: Array<{ id: VaultCategory; label: string; icon: typeof KeyRound }> = [
  { id: 'Login', label: 'Logins', icon: KeyRound },
  { id: 'API Key', label: 'Chaves de API', icon: FileKey2 },
  { id: '.env', label: 'Ambientes', icon: Braces },
  { id: 'Outros', label: 'Outros', icon: Package },
];

const Vault: React.FC<VaultProps> = ({ expanded = false }) => {
  const { vaultItems, addVaultItem, deleteVaultItem } = useApp();
  const [activeTab, setActiveTab] = useState<VaultCategory>('Login');
  const [isAdding, setIsAdding] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: '', content: '', category: 'Login' as VaultCategory });
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredItems = vaultItems.filter((item) => item.category === activeTab);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setActionError('Nao foi possivel copiar o segredo. Permita o acesso a area de transferencia.');
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newItem.title.trim() || !newItem.content.trim()) return;
    setIsSaving(true);
    setActionError(null);
    try {
      await addVaultItem({ ...newItem, title: newItem.title.trim(), content: newItem.content.trim() });
      setActiveTab(newItem.category);
      setNewItem({ title: '', content: '', category: activeTab });
      setIsAdding(false);
    } catch {
      setActionError('O item nao foi salvo no cofre. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Remover "${title}" do cofre?`)) return;
    setActionError(null);
    try {
      await deleteVaultItem(id);
    } catch {
      setActionError('O item nao foi excluido do cofre. Tente novamente.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[13px] border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
            <LockKeyhole size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Cofre técnico</h3>
            <p className="mt-0.5 text-[10px] text-neutral-600">{vaultItems.length} itens protegidos no workspace</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((value) => !value)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition ${
            isAdding
              ? 'border border-white/[0.08] bg-white/[0.035] text-neutral-300'
              : 'bg-emerald-300 text-[#07110c] hover:bg-emerald-200'
          }`}
        >
          {isAdding ? <X size={15} /> : <Plus size={15} />}
          {isAdding ? 'Cancelar' : 'Guardar item'}
        </button>
      </div>

      {actionError && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">{actionError}</p>}

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-[14px] border border-white/[0.06] bg-black/10 p-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const count = vaultItems.filter((item) => item.category === id).length;
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-[10px] font-medium transition ${
                active ? 'bg-white/[0.07] text-neutral-100 shadow-sm' : 'text-neutral-600 hover:text-neutral-300'
              }`}
            >
              <Icon size={13} />
              {label}
              <span className={`rounded-md px-1.5 py-0.5 text-[8px] ${active ? 'bg-emerald-300/10 text-emerald-300' : 'bg-white/[0.035]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {isAdding && (
          <motion.form
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            onSubmit={handleAdd}
            className="overflow-hidden"
          >
            <div className="rounded-[18px] border border-emerald-400/10 bg-emerald-400/[0.025] p-4">
              <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-600">Identificação</span>
                  <input
                    placeholder="Ex.: Banco de produção"
                    className="field-control"
                    value={newItem.title}
                    onChange={(event) => setNewItem({ ...newItem, title: event.target.value })}
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-600">Categoria</span>
                  <select
                    className="field-control"
                    value={newItem.category}
                    onChange={(event) => setNewItem({ ...newItem, category: event.target.value as VaultCategory })}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-600">Conteúdo sensível</span>
                <textarea
                  placeholder="Cole a credencial, token ou conteúdo do arquivo..."
                  rows={4}
                  className="field-control resize-y font-mono leading-5"
                  value={newItem.content}
                  onChange={(event) => setNewItem({ ...newItem, content: event.target.value })}
                />
              </label>
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving || !newItem.title.trim() || !newItem.content.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-[#07110c] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ShieldCheck size={15} /> {isSaving ? 'Salvando...' : 'Proteger no cofre'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className={`custom-scrollbar mt-5 grid gap-3 overflow-y-auto pr-1 ${expanded ? 'max-h-none md:grid-cols-2' : 'max-h-[340px]'}`}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const visible = visibleItems[item.id];
            const copied = copiedId === item.id;
            return (
              <motion.article
                layout
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="group rounded-[16px] border border-white/[0.06] bg-black/10 p-4 transition hover:border-white/[0.11] hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-emerald-400/[0.07] text-emerald-300/70">
                      <ShieldCheck size={14} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-medium text-neutral-300">{item.title}</h4>
                      <p className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-neutral-700">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <VaultAction
                      label="Copiar"
                      onClick={() => void handleCopy(item.id, item.content)}
                      icon={copied ? Check : Copy}
                      active={copied}
                    />
                    <VaultAction
                      label={visible ? 'Ocultar' : 'Exibir'}
                      onClick={() => setVisibleItems((current) => ({ ...current, [item.id]: !current[item.id] }))}
                      icon={visible ? EyeOff : Eye}
                    />
                    <VaultAction
                      label="Excluir"
                      onClick={() => void handleDelete(item.id, item.title)}
                      icon={Trash2}
                      danger
                    />
                  </div>
                </div>
                <div
                  className={`mt-3 min-h-10 rounded-xl border border-white/[0.05] bg-black/20 px-3 py-2.5 font-mono text-[10px] leading-5 break-all ${
                    visible ? 'text-emerald-200/80' : 'select-none tracking-[0.18em] text-neutral-700'
                  }`}
                >
                  {visible ? item.content : '••••••••••••••••••••••••'}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className={`flex min-h-48 flex-col items-center justify-center rounded-[18px] border border-dashed border-white/[0.07] text-center ${expanded ? 'md:col-span-2' : ''}`}>
            <LockKeyhole size={20} className="text-neutral-700" />
            <p className="mt-3 text-xs font-medium text-neutral-400">Nenhum item nesta categoria</p>
            <p className="mt-1 text-[10px] text-neutral-700">Use “Guardar item” para adicionar o primeiro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const VaultAction: React.FC<{
  label: string;
  onClick: () => void;
  icon: typeof Copy;
  active?: boolean;
  danger?: boolean;
}> = ({ label, onClick, icon: Icon, active, danger }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`grid h-8 w-8 place-items-center rounded-lg transition ${
      danger
        ? 'text-neutral-700 hover:bg-rose-400/10 hover:text-rose-300'
        : active
          ? 'bg-emerald-400/10 text-emerald-300'
          : 'text-neutral-600 hover:bg-white/[0.05] hover:text-neutral-300'
    }`}
  >
    <Icon size={14} />
  </button>
);

export default Vault;
