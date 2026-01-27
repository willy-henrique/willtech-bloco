
import React from 'react';
import { useApp } from '../AppContext';
import { TaskPriority, Task } from '../types';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Coffee, Trash2, CheckCircle2 } from 'lucide-react';

const EisenhowerMatrix: React.FC = () => {
  const { tasks, toggleTask, deleteTask } = useApp();

  const filterTasks = (priority: TaskPriority[]) => {
    return tasks.filter(t => !t.isCompleted && priority.includes(t.priority));
  };

  const Quadrant = ({ title, tasks, icon: Icon, colorClass, subtitle }: any) => (
    <div className={`flex flex-col h-full bg-neutral-900/40 border border-neutral-800/60 rounded-xl overflow-hidden`}>
      <div className={`flex items-center justify-between p-3 border-b border-neutral-800 bg-neutral-900/60`}>
        <div className="flex items-center gap-2">
          <Icon size={16} className={colorClass} />
          <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
        </div>
        <span className="text-[10px] text-neutral-600 font-mono">{tasks.length} tasks</span>
      </div>
      <div className="p-2 text-[10px] text-neutral-500 italic px-3 bg-neutral-950/30">{subtitle}</div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-48 custom-scrollbar">
        {tasks.map((task: Task) => (
          <motion.div
            layout
            key={task.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="group flex items-start gap-2 p-2 rounded bg-neutral-800/50 border border-neutral-700/50 hover:border-lime-500/30 transition-all"
          >
            <button 
              onClick={() => toggleTask(task.id)}
              className="mt-0.5 text-neutral-600 hover:text-lime-500"
            >
              <CheckCircle2 size={14} />
            </button>
            <div className="flex-1">
              <p className="text-xs text-neutral-300 leading-tight">{task.description}</p>
              <span className="text-[9px] font-mono text-neutral-600 uppercase mt-1 inline-block">
                {task.projectId}
              </span>
            </div>
            <button 
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-700 text-[10px] uppercase font-bold py-10">
            All clear
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      <Quadrant 
        title="Critical & Urgent" 
        subtitle="Do it immediately"
        tasks={filterTasks([TaskPriority.CRITICAL])} 
        icon={AlertTriangle} 
        colorClass="text-red-500"
      />
      <Quadrant 
        title="Important" 
        subtitle="Schedule for later"
        tasks={filterTasks([TaskPriority.URGENT])} 
        icon={Zap} 
        colorClass="text-lime-400"
      />
      <Quadrant 
        title="Secondary" 
        subtitle="Delegate if possible"
        tasks={filterTasks([TaskPriority.NORMAL])} 
        icon={Coffee} 
        colorClass="text-blue-400"
      />
      <Quadrant 
        title="Backlog" 
        subtitle="Eliminate distractions"
        tasks={filterTasks([TaskPriority.LOW])} 
        icon={Trash2} 
        colorClass="text-neutral-500"
      />
    </div>
  );
};

export default EisenhowerMatrix;
