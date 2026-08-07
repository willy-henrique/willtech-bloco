
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { TaskPriority, Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap, Coffee, Trash2, CheckCircle2, Plus, X } from 'lucide-react';

const EisenhowerMatrix: React.FC = () => {
  const { tasks, toggleTask, deleteTask, addTask } = useApp();
  const [editingQuadrant, setEditingQuadrant] = useState<TaskPriority | null>(null);
  const [newTaskText, setNewTaskText] = useState<Record<TaskPriority, string>>({
    [TaskPriority.CRITICAL]: '',
    [TaskPriority.URGENT]: '',
    [TaskPriority.NORMAL]: '',
    [TaskPriority.LOW]: ''
  });

  const filterTasks = (priority: TaskPriority[]) => {
    return tasks.filter(t => !t.isCompleted && priority.includes(t.priority));
  };

  const handleAddTask = async (priority: TaskPriority) => {
    const text = newTaskText[priority].trim();
    if (!text) return;
    
    try {
      await addTask('Geral', text, priority);
      setNewTaskText({ ...newTaskText, [priority]: '' });
      setEditingQuadrant(null);
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const handleClearAll = async (priority: TaskPriority) => {
    const quadrantTasks = filterTasks([priority]);
    if (window.confirm(`Tem certeza que deseja limpar todas as ${quadrantTasks.length} tarefas desta coluna?`)) {
      for (const task of quadrantTasks) {
        await deleteTask(task.id);
      }
    }
  };

  const Quadrant = ({ title, tasks, icon: Icon, colorClass, subtitle, priority }: any) => {
    const isEditing = editingQuadrant === priority;
    const taskCount = tasks.length;

    return (
      <div className={`flex flex-col h-full bg-gradient-to-br from-neutral-900/60 to-neutral-950/60 border-2 border-neutral-800/60 rounded-2xl overflow-hidden shadow-lg`}>
        <div className={`flex items-center justify-between p-4 border-b-2 border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-950`}>
          <div className="flex items-center gap-2.5">
            <Icon size={18} className={colorClass} />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">{title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 font-mono font-bold bg-neutral-800 px-2 py-1 rounded">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </span>
            {taskCount > 0 && (
              <button
                onClick={() => handleClearAll(priority)}
                className="text-[9px] text-neutral-500 hover:text-red-400 font-bold uppercase transition-colors"
                title="Limpar todas as tarefas"
              >
                ALL CLEAR
              </button>
            )}
          </div>
        </div>
        <div className="p-2.5 text-[10px] text-neutral-500 italic px-4 bg-neutral-950/50 border-b border-neutral-800/50">
          {subtitle}
        </div>
        
        {/* Input para nova tarefa */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 border-b border-neutral-800 bg-neutral-950/80"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite a tarefa..."
                  value={newTaskText[priority]}
                  onChange={(e) => setNewTaskText({ ...newTaskText, [priority]: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTask(priority);
                    }
                    if (e.key === 'Escape') {
                      setEditingQuadrant(null);
                      setNewTaskText({ ...newTaskText, [priority]: '' });
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500/50"
                  autoFocus
                />
                <button
                  onClick={() => handleAddTask(priority)}
                  className="px-3 py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-400 transition-colors font-bold text-xs"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setEditingQuadrant(null);
                    setNewTaskText({ ...newTaskText, [priority]: '' });
                  }}
                  className="px-3 py-2 bg-neutral-800 text-neutral-400 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-64 custom-scrollbar">
          <AnimatePresence>
            {tasks.map((task: Task) => (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group flex items-start gap-2 p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/50 hover:border-lime-500/50 hover:bg-neutral-800/80 transition-all cursor-pointer"
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 text-neutral-600 hover:text-lime-500 transition-colors flex-shrink-0"
                  title="Marcar como concluída"
                >
                  <CheckCircle2 size={16} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-200 leading-relaxed break-words">{task.description}</p>
                  {task.projectId !== 'Geral' && (
                    <span className="text-[9px] font-mono text-neutral-500 uppercase mt-1 inline-block">
                      {task.projectId}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-500 transition-all flex-shrink-0"
                  title="Deletar tarefa"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && !isEditing && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-[10px] uppercase font-bold py-12">
              <div className="mb-2">ALL CLEAR</div>
              <button
                onClick={() => setEditingQuadrant(priority)}
                className="mt-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-lime-400 rounded-lg transition-all flex items-center gap-1.5 text-xs"
              >
                <Plus size={12} />
                Adicionar
              </button>
            </div>
          )}
          
          {tasks.length > 0 && !isEditing && (
            <button
              onClick={() => setEditingQuadrant(priority)}
              className="w-full mt-2 px-3 py-2 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-lime-500/50 text-neutral-400 hover:text-lime-400 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Plus size={14} />
              Adicionar Tarefa
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_10px_#84cc16]"></div>
          Strategic Priorities
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <Quadrant 
          title="Critical & Urgent" 
          subtitle="Do it immediately"
          tasks={filterTasks([TaskPriority.CRITICAL])} 
          icon={AlertTriangle} 
          colorClass="text-red-500"
          priority={TaskPriority.CRITICAL}
        />
        <Quadrant 
          title="Important" 
          subtitle="Schedule for later"
          tasks={filterTasks([TaskPriority.URGENT])} 
          icon={Zap} 
          colorClass="text-lime-400"
          priority={TaskPriority.URGENT}
        />
        <Quadrant 
          title="Secondary" 
          subtitle="Delegate if possible"
          tasks={filterTasks([TaskPriority.NORMAL])} 
          icon={Coffee} 
          colorClass="text-blue-400"
          priority={TaskPriority.NORMAL}
        />
        <Quadrant 
          title="Backlog" 
          subtitle="Eliminate distractions"
          tasks={filterTasks([TaskPriority.LOW])} 
          icon={Trash2} 
          colorClass="text-neutral-500"
          priority={TaskPriority.LOW}
        />
      </div>
    </div>
  );
};

export default EisenhowerMatrix;
