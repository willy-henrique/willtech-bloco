import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, FolderKanban, Bell, Mic, X } from 'lucide-react';
import { useApp } from '../../AppContext';
import { useToast } from '../../hooks/useToast';
import { todayAt, tomorrowAt } from '../../lib/dates';
import { Button } from '../../components/ui/Button';

interface QuickCaptureProps {
  open: boolean;
  onClose: () => void;
}

type Chip = 'today' | 'tomorrow' | 'date' | 'reminder' | 'project' | null;

export const QuickCapture: React.FC<QuickCaptureProps> = ({ open, onClose }) => {
  const { captureQuick, projects } = useApp();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [chip, setChip] = useState<Chip>(null);
  const [showMore, setShowMore] = useState(false);
  const [projectId, setProjectId] = useState<string>('');
  const [customDate, setCustomDate] = useState('');
  const [asNote, setAsNote] = useState(false);
  const [asReminder, setAsReminder] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText('');
      setChip(null);
      setShowMore(false);
      setProjectId('');
      setCustomDate('');
      setAsNote(false);
      setAsReminder(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  const save = async () => {
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    try {
      let dueAt: number | null = null;
      let reminderAt: number | null = null;
      if (chip === 'today') dueAt = todayAt(9);
      if (chip === 'tomorrow') dueAt = tomorrowAt(9);
      if ((chip === 'date' || chip === 'reminder') && customDate) {
        dueAt = new Date(customDate).getTime();
        if (chip === 'reminder' || asReminder) reminderAt = dueAt;
      }
      const result = await captureQuick({
        text: value,
        dueAt,
        reminderAt,
        projectId: projectId || null,
        asNote,
        asReminder: asReminder || chip === 'reminder',
      });
      const labels: Record<string, string> = {
        task: 'Tarefa criada ✓',
        note: 'Nota salva ✓',
        event: 'Evento salvo ✓',
        reminder: 'Lembrete salvo ✓',
      };
      toast(labels[result.kind] || 'Salvo ✓');
      onClose();
    } catch (e) {
      console.error(e);
      toast('Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void save();
    }
    if (e.key === 'Escape') onClose();
  };

  const startVoice = () => {
    type RecognitionLike = {
      lang: string;
      start: () => void;
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: new () => RecognitionLike;
      webkitSpeechRecognition?: new () => RecognitionLike;
    };
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      toast('Microfone não suportado neste navegador');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.start();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Captura rápida"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="relative z-10 w-full max-w-lg rounded-t-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[var(--radius-lg)] sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg">Captura rápida</p>
              <button
                type="button"
                aria-label="Fechar captura"
                className="flex h-11 w-11 items-center justify-center text-[var(--muted)]"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={3}
              placeholder="Digite ou fale qualquer coisa…"
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-3 text-[var(--text)] placeholder:text-[var(--muted)]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ['today', 'Hoje'],
                  ['tomorrow', 'Amanhã'],
                  ['date', 'Data'],
                  ['reminder', 'Lembrete'],
                  ['project', 'Projeto'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChip(chip === id ? null : id)}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm ${
                    chip === id
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                  }`}
                >
                  {id === 'date' && <Calendar size={14} aria-hidden />}
                  {id === 'reminder' && <Bell size={14} aria-hidden />}
                  {id === 'project' && <FolderKanban size={14} aria-hidden />}
                  {label}
                </button>
              ))}
            </div>
            {(chip === 'date' || chip === 'reminder') && (
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-3"
              />
            )}
            {chip === 'project' && (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-3 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg)] px-3 py-3"
              >
                <option value="">Sem projeto (Inbox)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {showMore && (
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={asNote} onChange={(e) => setAsNote(e.target.checked)} />
                  Salvar como nota
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={asReminder}
                    onChange={(e) => setAsReminder(e.target.checked)}
                  />
                  É lembrete
                </label>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowMore((v) => !v)}>
                Mais opções
              </Button>
              <button
                type="button"
                aria-label="Usar microfone"
                onClick={startVoice}
                className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
              >
                <Mic size={20} />
              </button>
              <Button className="ml-auto" onClick={() => void save()} disabled={!text.trim() || saving}>
                Enviar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
