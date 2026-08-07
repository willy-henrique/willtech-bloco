
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { Snippet } from '../types';
import { Copy, Database, Code, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SnippetManager: React.FC = () => {
  const { snippets, addSnippet } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSnippet, setNewSnippet] = useState({ title: '', code: '', language: 'sql', description: '' });

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnippet.title || !newSnippet.code) return;
    addSnippet(newSnippet);
    setNewSnippet({ title: '', code: '', language: 'sql', description: '' });
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
          <Database size={16} className="text-blue-400" /> Snippets & Queries
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-lime-500/10 text-lime-400 hover:bg-lime-500 hover:text-black transition-all"
        >
          <Plus size={16} />
        </button>
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
            <input 
              placeholder="Query Title"
              className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded text-sm text-lime-400 focus:border-lime-500 outline-none"
              value={newSnippet.title}
              onChange={e => setNewSnippet({...newSnippet, title: e.target.value})}
            />
            <textarea 
              placeholder="-- Write your SQL here..."
              rows={4}
              className="w-full bg-neutral-950 border border-neutral-800 p-2 rounded text-xs font-mono text-neutral-300 focus:border-lime-500 outline-none"
              value={newSnippet.code}
              onChange={e => setNewSnippet({...newSnippet, code: e.target.value})}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-lime-500 text-black text-xs font-bold rounded hover:bg-lime-400 transition-colors">SAVE SNIPPET</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-neutral-800 text-neutral-400 text-xs font-bold rounded hover:bg-neutral-700">CANCEL</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid gap-3 overflow-y-auto pr-1 max-h-[400px]">
        {snippets.map((snippet) => (
          <div key={snippet.id} className="group bg-neutral-900/60 rounded-xl border border-neutral-800 p-4 hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-neutral-500" />
                <h4 className="text-xs font-bold text-neutral-200">{snippet.title}</h4>
              </div>
              <button 
                onClick={() => handleCopy(snippet.id, snippet.code)}
                className="text-neutral-600 hover:text-white transition-colors"
              >
                {copiedId === snippet.id ? <Check size={14} className="text-lime-500" /> : <Copy size={14} />}
              </button>
            </div>
            {snippet.description && <p className="text-[10px] text-neutral-500 mb-3 italic">{snippet.description}</p>}
            <pre className="bg-neutral-950 p-3 rounded-lg text-[11px] font-mono text-blue-300 overflow-x-auto border border-neutral-800">
              <code>{snippet.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SnippetManager;
