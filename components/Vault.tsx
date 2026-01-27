
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { VaultCategory, VaultItem } from '../types';
import { Lock, Eye, EyeOff, Plus, Trash2, ShieldCheck, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Vault: React.FC = () => {
  const { vaultItems, addVaultItem, deleteVaultItem } = useApp();
  const [activeTab, setActiveTab] = useState<VaultCategory>('Login');
  const [isAdding, setIsAdding] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [newItem, setNewItem] = useState({ title: '', content: '', category: 'Login' as VaultCategory });

  const categories: VaultCategory[] = ['Login', 'API Key', '.env', 'Outros'];

  const handleToggleVisibility = (id: string) => {
    setVisibleItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.content) return;
    addVaultItem(newItem);
    setNewItem({ title: '', content: '', category: activeTab });
    setIsAdding(false);
  };

  const filteredItems = vaultItems.filter(item => item.category === activeTab);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-widest text-lime-400 flex items-center gap-2">
          <Lock size={16} /> Tech Vault
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-lime-500/10 text-lime-400 hover:bg-lime-500 hover:text-black transition-all"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-800 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === cat 
                ? 'border-lime-500 text-lime-500 bg-lime-500/5' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              <input 
                placeholder="Identificador (ex: DB Prod)"
                className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded text-xs text-white outline-none focus:border-lime-500"
                value={newItem.title}
                onChange={e => setNewItem({...newItem, title: e.target.value})}
              />
              <select 
                className="bg-neutral-950 border border-neutral-800 p-2 rounded text-[10px] text-neutral-400 outline-none"
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value as VaultCategory})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea 
              placeholder="Conteúdo sensível..."
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded text-xs font-mono text-neutral-300 focus:border-lime-500 outline-none"
              value={newItem.content}
              onChange={e => setNewItem({...newItem, content: e.target.value})}
            />
            <button type="submit" className="w-full py-2 bg-lime-500 text-black text-[10px] font-bold rounded hover:bg-lime-400 uppercase">
              Lock in Vault
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 group hover:border-neutral-700 transition-all">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase">
                <ShieldCheck size={12} className="text-lime-500" /> {item.title}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCopy(item.id, item.content)} className="text-neutral-600 hover:text-white">
                  {copiedId === item.id ? <Check size={12} className="text-lime-500" /> : <Copy size={12} />}
                </button>
                <button onClick={() => handleToggleVisibility(item.id)} className="text-neutral-600 hover:text-white">
                  {visibleItems[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => deleteVaultItem(item.id)} className="text-neutral-600 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div className={`p-2 rounded bg-neutral-950 border border-neutral-800/50 font-mono text-[10px] break-all ${visibleItems[item.id] ? 'text-lime-400' : 'text-neutral-700 select-none'}`}>
              {visibleItems[item.id] ? item.content : '••••••••••••••••••••••••'}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="py-10 text-center text-[10px] text-neutral-600 uppercase font-bold border-2 border-dashed border-neutral-900 rounded-xl">
            Vault is empty for {activeTab}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault;
