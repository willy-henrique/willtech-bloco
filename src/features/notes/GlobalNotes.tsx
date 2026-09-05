import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Plus, Search, Trash2, Edit3, FolderKanban, 
  Calendar, Tag, ArrowUpRight, Check, X, Sparkles
} from 'lucide-react';
import { Project, ProjectNote } from '../../../types';

interface GlobalNotesProps {
  projects: Project[];
  notes: ProjectNote[];
  isLoading?: boolean;
  onAddNote: (note: Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateNote: (id: string, updates: Partial<ProjectNote>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onOpenProject?: (projectId: string) => void;
}

export const GlobalNotes: React.FC<GlobalNotesProps> = ({
  projects,
  notes,
  isLoading = false,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onOpenProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formProjectId, setFormProjectId] = useState(projects[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Project map for quick lookups
  const projectMap = useMemo(() => {
    return new Map(projects.map(p => [p.id, p]));
  }, [projects]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.category && n.category.trim()) set.add(n.category.trim());
    });
    return ['Todas', ...Array.from(set)];
  }, [notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchProject = selectedProjectId === 'all' || n.projectId === selectedProjectId;
      const matchCategory = selectedCategory === 'Todas' || n.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        n.title.toLowerCase().includes(query) || 
        n.content.toLowerCase().includes(query) ||
        (n.category && n.category.toLowerCase().includes(query));
      return matchProject && matchCategory && matchQuery;
    });
  }, [notes, selectedProjectId, selectedCategory, searchQuery]);

  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('');
    setFormProjectId(projects[0]?.id || '');
    setErrorMsg(null);
    setIsCreating(true);
  };

  const handleOpenEdit = (note: ProjectNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category || '');
    setFormProjectId(note.projectId);
    setErrorMsg(null);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim() || !formProjectId) {
      setErrorMsg('Título, conteúdo e projeto são obrigatórios.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (editingNote) {
        await onUpdateNote(editingNote.id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory.trim() || undefined,
          projectId: formProjectId
        });
      } else {
        await onAddNote({
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory.trim() || undefined,
          projectId: formProjectId
        });
      }
      setIsCreating(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar a anotação.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (note: ProjectNote) => {
    if (!window.confirm(`Excluir a anotação "${note.title}"?`)) return;
    try {
      await onDeleteNote(note.id);
    } catch (err: any) {
      alert(err?.message || 'Erro ao excluir.');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">Central de Anotações</h2>
            <p className="text-xs text-neutral-400">
              Todas as notas e diretrizes dos seus projetos em um só lugar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-xs font-semibold text-[#07110c] shadow-[0_10px_25px_rgba(52,211,153,0.15)] transition hover:bg-emerald-200 active:scale-95"
        >
          <Plus size={16} /> Nova Anotação
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, conteúdo ou tag..."
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] pl-10 pr-4 text-xs text-neutral-200 outline-none transition placeholder:text-neutral-500 focus:border-emerald-400/30 focus:bg-emerald-400/[0.025]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-11 rounded-xl border border-white/[0.08] bg-[#121614] px-3.5 text-xs text-neutral-300 outline-none transition focus:border-emerald-400/30"
          >
            <option value="all">Todos os Projetos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 rounded-xl border border-white/[0.08] bg-[#121614] px-3.5 text-xs text-neutral-300 outline-none transition focus:border-emerald-400/30"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-neutral-500 mb-3">
            <FileText size={22} />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200">Nenhuma anotação encontrada</h3>
          <p className="mt-1 max-w-sm text-xs text-neutral-500">
            Crie sua primeira nota ou me peça aqui pelo Discord para salvar diretamente no projeto!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => {
            const project = projectMap.get(note.projectId);
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121614]/90 p-5 backdrop-blur-sm transition hover:border-emerald-400/25 hover:bg-[#141a17]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    {project ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          color: project.color,
                          borderColor: `${project.color}30`,
                          backgroundColor: `${project.color}12`,
                        }}
                      >
                        <FolderKanban size={11} />
                        {project.name}
                      </span>
                    ) : (
                      <span className="rounded-lg border border-white/[0.08] bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400">
                        Geral
                      </span>
                    )}

                    {note.category && (
                      <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                        {note.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-100 line-clamp-1 group-hover:text-white">
                    {note.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-neutral-400 line-clamp-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(note.updatedAt || note.createdAt)}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      title="Editar"
                      className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(note)}
                      title="Excluir"
                      className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <Trash2 size={13} />
                    </button>
                    {onOpenProject && project && (
                      <button
                        type="button"
                        onClick={() => onOpenProject(project.id)}
                        title="Abrir detalhes do projeto"
                        className="grid h-7 w-7 place-items-center rounded-lg text-neutral-400 hover:bg-emerald-400/10 hover:text-emerald-300"
                      >
                        <ArrowUpRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Nota */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.1] bg-[#121614] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <h3 className="text-base font-semibold text-white">
                  {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-neutral-200"
                >
                  <X size={18} />
                </button>
              </div>

              {errorMsg && (
                <p className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-2.5 text-xs text-rose-300">
                  {errorMsg}
                </p>
              )}

              <form onSubmit={handleSave} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Projeto</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0d100f] px-3.5 py-2.5 text-xs text-neutral-200 outline-none focus:border-emerald-400/30"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Título</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Reunião alinhamento, Decisão de arquitetura..."
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0d100f] px-3.5 py-2.5 text-xs text-neutral-200 outline-none focus:border-emerald-400/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">Categoria / Tag (opcional)</label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="Ex: Ideia, Bug, Arquitetura"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#0d100f] px-3.5 py-2.5 text-xs text-neutral-200 outline-none focus:border-emerald-400/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">Conteúdo da Anotação</label>
                  <textarea
                    rows={6}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Escreva tudo o que precisa registrar para este projeto..."
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0d100f] p-3.5 text-xs text-neutral-200 outline-none focus:border-emerald-400/30"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2 text-xs font-semibold text-[#07110c] hover:bg-emerald-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : <><Check size={14} /> Salvar Anotação</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalNotes;
