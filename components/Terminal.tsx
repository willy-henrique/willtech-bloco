
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../AppContext';
import { ProjectId, TaskPriority } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, ChevronRight } from 'lucide-react';

const Terminal: React.FC = () => {
  const { addTask, projects } = useApp();
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<{ text: string; type: 'success' | 'error' | 'info' }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    // Pattern: /task [project] [priority?] [description]
    // Example: /task naturize critical fix database leak
    const taskMatch = cmd.match(/^\/task\s+(\w+)\s+(critical|urgent|normal|low)?\s*(.+)$/i);

    if (taskMatch) {
      const [, projName, priorityInput, desc] = taskMatch;
      
      const project = projects.find(p => p.id.toLowerCase().includes(projName.toLowerCase()));
      
      if (!project) {
        addLog(`Error: Project "${projName}" not found.`, 'error');
      } else {
        const priority = priorityInput 
          ? (priorityInput.charAt(0).toUpperCase() + priorityInput.slice(1).toLowerCase()) as TaskPriority
          : TaskPriority.NORMAL;
          
        addTask(project.id, desc, priority);
        addLog(`Task added to ${project.name} [${priority}]: ${desc}`, 'success');
      }
    } else if (cmd === '/help') {
      addLog('Available commands: /task [project] [priority] [desc], /clear', 'info');
    } else if (cmd === '/clear') {
      setLogs([]);
    } else {
      addLog(`Unknown command: ${cmd}. Type /help for assistance.`, 'error');
    }

    setInput('');
  };

  const addLog = (text: string, type: 'success' | 'error' | 'info') => {
    setLogs(prev => [{ text, type }, ...prev].slice(0, 5));
  };

  return (
    <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <TerminalIcon size={14} className="text-lime-500" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">Quick Intake Terminal</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-700"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-lime-500/50"></div>
        </div>
      </div>
      
      <div className="p-4 font-mono text-sm">
        <form onSubmit={handleCommand} className="flex items-center gap-2 group">
          <ChevronRight size={18} className="text-lime-500 group-focus-within:animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type /task [project] [desc] to input demand..."
            className="flex-1 bg-transparent border-none outline-none text-lime-400 placeholder:text-neutral-600"
            autoFocus
          />
        </form>

        <div className="mt-3 space-y-1 overflow-hidden h-24">
          <AnimatePresence initial={false}>
            {logs.map((log, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`text-xs ${
                  log.type === 'success' ? 'text-lime-500' :
                  log.type === 'error' ? 'text-red-400' :
                  'text-neutral-400'
                }`}
              >
                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {logs.length === 0 && <div className="text-neutral-700 text-xs">Waiting for command...</div>}
        </div>
      </div>
    </div>
  );
};

export default Terminal;
