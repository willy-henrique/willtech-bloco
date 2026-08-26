import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import { useApp } from '../../../AppContext';
import { Project, TaskPriority } from '../../../types';
import { resolveProject } from './resolveProject';
import { parseIntent, type CaptureType } from './parseIntent';

interface SavedMessage {
  id: string;
  role: 'agent';
  kind: 'saved';
  projectName: string;
  projectColor: string;
  type: CaptureType;
  priority: TaskPriority;
  description: string;
}

interface AskMessage {
  id: string;
  role: 'agent';
  kind: 'ask';
  reason: 'ambiguous' | 'unknown';
  description: string;
  type: CaptureType;
  priority: TaskPriority;
  options: Project[];
}

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | SavedMessage
  | AskMessage;

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  [TaskPriority.CRITICAL]: 'Crítico',
  [TaskPriority.URGENT]: 'Urgente',
  [TaskPriority.NORMAL]: 'Normal',
  [TaskPriority.LOW]: 'Baixa',
};

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  [TaskPriority.CRITICAL]: 'bg-red-500/10 text-red-400 border-red-500/20',
  [TaskPriority.URGENT]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  [TaskPriority.NORMAL]: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
  [TaskPriority.LOW]: 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20',
};

let messageSeq = 0;
const nextId = () => `m${++messageSeq}`;

const CaptureChat: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { projects, addTask } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const commit = useCallback(
    async (project: Project, description: string, type: CaptureType, priority: TaskPriority) => {
      setBusy(true);
      try {
        await addTask(project.id, description, priority);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'agent',
            kind: 'saved',
            projectName: project.name,
            projectColor: project.color,
            type,
            priority,
            description,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [addTask]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || busy) return;

      setInput('');
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);

      const intent = parseIntent(text);
      const description = intent.description || text;
      const resolution = resolveProject(text, projects);

      if (resolution.status === 'resolved') {
        const project = projects.find((p) => p.id === resolution.projectId);
        if (project) {
          await commit(project, description, intent.type, intent.priority);
          return;
        }
      }

      // Ambíguo ou desconhecido: perguntar em vez de chutar.
      const options =
        resolution.status === 'ambiguous'
          ? (resolution.candidates
              .map((c) => projects.find((p) => p.id === c.projectId))
              .filter(Boolean) as Project[])
          : projects;

      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'agent',
          kind: 'ask',
          reason: resolution.status === 'ambiguous' ? 'ambiguous' : 'unknown',
          description,
          type: intent.type,
          priority: intent.priority,
          options,
        },
      ]);
    },
    [input, busy, projects, commit]
  );

  const answerAsk = useCallback(
    async (message: AskMessage, project: Project) => {
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      await commit(project, message.description, message.type, message.priority);
    },
    [commit]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog"
            aria-label="Captura rápida"
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l
                       border-neutral-800 bg-neutral-950 sm:w-[420px]"
          >
            <header className="flex items-center justify-between border-b border-neutral-900 px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-lime-400" aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
                  Captura
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar captura"
                className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-200"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Escreva do jeito que você fala
                  </p>
                  <ul className="space-y-1.5 text-sm text-neutral-400">
                    <li>“a sessão do whats caiu de novo”</li>
                    <li>“o RAG tá devolvendo lixo, urgente”</li>
                    <li>“nota: o cliente prefere pix”</li>
                  </ul>
                  <p className="mt-3 text-xs text-neutral-600">
                    Eu descubro o projeto e a prioridade. Se ficar em dúvida, pergunto.
                  </p>
                </div>
              )}

              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-lime-500/10 px-3.5 py-2.5
                                  text-sm text-lime-100 ring-1 ring-lime-500/20">
                      {m.text}
                    </p>
                  </div>
                ) : m.kind === 'saved' ? (
                  <div
                    key={m.id}
                    className="rounded-2xl rounded-bl-sm border border-neutral-900 bg-neutral-900/50 px-3.5 py-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-lime-400" aria-hidden="true" />
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: m.projectColor }}
                      >
                        {m.projectName}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_CLASS[m.priority]}`}
                      >
                        {PRIORITY_LABEL[m.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300">{m.description}</p>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className="rounded-2xl rounded-bl-sm border border-neutral-800 bg-neutral-900/50 px-3.5 py-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <HelpCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                      <span className="text-sm text-neutral-300">
                        {m.reason === 'ambiguous'
                          ? 'Não sei qual dos dois. Qual é?'
                          : 'Não reconheci o projeto. Qual é?'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.options.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => answerAsk(m, p)}
                          className="rounded-lg border border-neutral-800 px-2.5 py-1.5 text-xs
                                     font-medium text-neutral-300 transition
                                     hover:border-neutral-600 hover:bg-neutral-800"
                          style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-neutral-900 p-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="O que precisa ser feito?"
                  aria-label="O que precisa ser feito?"
                  disabled={busy}
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5
                             text-sm text-neutral-200 placeholder:text-neutral-600
                             focus:border-lime-500/40 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Enviar"
                  className="rounded-xl bg-lime-500 p-2.5 text-neutral-950 transition
                             hover:bg-lime-400 disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CaptureChat;
