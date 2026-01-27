
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<Project>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  project?: Project | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  project
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    status: 'Active' as 'Active' | 'Maintenance' | 'Legacy',
    progress: 0,
    color: '#3fcf8e',
    stack: 'React/Node'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        type: project.type,
        status: project.status,
        progress: project.progress,
        color: project.color,
        stack: project.stack || 'React/Node'
      });
    } else {
      setFormData({
        name: '',
        type: '',
        status: 'Active',
        progress: 0,
        color: '#3fcf8e',
        stack: 'React/Node'
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (project && onUpdate) {
        await onUpdate(project.id, formData);
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !onDelete) return;
    if (window.confirm(`Tem certeza que deseja deletar o projeto "${project.name}"?`)) {
      try {
        await onDelete(project.id);
        onClose();
      } catch (error) {
        console.error('Erro ao deletar projeto:', error);
      }
    }
  };

  const presetColors = [
    '#3fcf8e', // WillTech Green
    '#00d1ff', // BI Blue
    '#ff9f00', // Warning Orange
    '#ff4d4d', // Critical Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#10b981'  // Emerald
  ];

  const presetStacks = [
    'React/Node',
    'PHP/SQL',
    'Vue/Node',
    'Angular/Node',
    'Next.js',
    'Laravel',
    'Django',
    'Flutter'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {project ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 transition-colors"
                    placeholder="Ex: Naturize"
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 transition-colors"
                    placeholder="Ex: ERP/SaaS, Business Intelligence"
                  />
                </div>

                {/* Status e Progresso */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-lime-500 transition-colors"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Legacy">Legacy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Progresso ({formData.progress}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Stack */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Stack Tecnológico
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {presetStacks.map((stack) => (
                      <button
                        key={stack}
                        type="button"
                        onClick={() => setFormData({ ...formData, stack })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          formData.stack === stack
                            ? 'bg-lime-500 text-black'
                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                        }`}
                      >
                        {stack}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.stack}
                    onChange={(e) => setFormData({ ...formData, stack: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 transition-colors"
                    placeholder="Ou digite um stack personalizado"
                  />
                </div>

                {/* Cor */}
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Cor do Projeto
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-xl border-2 transition-all ${
                          formData.color === color
                            ? 'border-lime-500 scale-110'
                            : 'border-neutral-700 hover:border-neutral-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-12 rounded-xl border border-neutral-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-lime-500 transition-colors"
                      placeholder="#3fcf8e"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {project && onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex-1 px-4 py-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Deletar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 bg-neutral-800 text-neutral-400 rounded-xl font-bold hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
