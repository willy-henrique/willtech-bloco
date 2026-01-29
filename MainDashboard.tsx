
import React, { useState } from 'react';
import { useApp } from './AppContext';
import Terminal from './components/Terminal';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import ProjectDetails from './components/ProjectDetails';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import SnippetManager from './components/SnippetManager';
import DeadlineCalendar from './components/DeadlineCalendar';
import Vault from './components/Vault';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutGrid, BarChart3, Settings, LogOut, Bell, Plus, Lock, Search } from 'lucide-react';
import { Project } from './types';

const MainDashboard: React.FC = () => {
  const { projects, tasks, addProject, updateProject, deleteProject } = useApp();
  const [mobileTab, setMobileTab] = useState<'projects' | 'tasks' | 'vault' | 'config'>('projects');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Se um projeto foi selecionado, mostrar detalhes
  if (selectedProject) {
    return (
      <ProjectDetails 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-20 flex-col items-center py-8 border-r border-neutral-800 bg-neutral-950 z-20">
        <div className="w-10 h-10 rounded-xl bg-lime-500 flex items-center justify-center mb-10 shadow-lg shadow-lime-500/20">
          <Shield className="text-black" size={24} />
        </div>
        
        <nav className="flex flex-col gap-8 flex-1">
          <button className="p-3 rounded-xl bg-neutral-900 text-lime-500 border border-neutral-800"><LayoutGrid size={20} /></button>
          <button className="p-3 rounded-xl text-neutral-500 hover:text-white transition-colors"><BarChart3 size={20} /></button>
          <button className="p-3 rounded-xl text-neutral-500 hover:text-white transition-colors"><Bell size={20} /></button>
          <button className="p-3 rounded-xl text-neutral-500 hover:text-white transition-colors"><Settings size={20} /></button>
        </nav>

        <button className="p-3 rounded-xl text-neutral-700 hover:text-red-400 mt-auto"><LogOut size={20} /></button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
        {/* Header - Optimized for Mobile */}
        <header className="px-4 py-4 md:px-8 md:py-6 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Will Tech <span className="text-[10px] bg-lime-500/10 text-lime-500 px-2 py-0.5 rounded-full border border-lime-500/20">OPS</span>
                </h1>
                <p className="text-[10px] md:text-xs text-neutral-500 font-mono font-bold uppercase">System Commander v2.4.5</p>
              </div>
              <div className="lg:hidden flex gap-2">
                <button className="p-2 rounded-lg bg-neutral-900 text-neutral-400"><Search size={18}/></button>
                <button className="p-2 rounded-lg bg-neutral-900 text-neutral-400"><Bell size={18}/></button>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
              <Terminal />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar pb-24 lg:pb-8">
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Left Column: Projects & Eisenhower */}
            <div className={`xl:col-span-8 space-y-8 ${mobileTab !== 'projects' && mobileTab !== 'tasks' ? 'hidden xl:block' : 'block'}`}>
              
              {/* Projects Grid */}
              <section className={mobileTab === 'tasks' ? 'hidden xl:block' : 'block'}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-lime-500 shadow-[0_0_10px_#84cc16]"></div>
                    Active Systems
                  </h2>
                  <button
                    onClick={() => {
                      setEditingProject(null);
                      setIsProjectModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-lime-500 text-black rounded-lg text-xs font-bold hover:bg-lime-400 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Novo Projeto
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="group relative cursor-pointer"
                      onClick={() => setSelectedProject(proj)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(proj);
                        setIsProjectModalOpen(true);
                      }}
                    >
                      <ProjectCard project={proj} tasks={tasks} />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(proj);
                            setIsProjectModalOpen(true);
                          }}
                          className="p-1.5 bg-neutral-800/90 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                          title="Editar projeto"
                        >
                          <Settings size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Priority Matrix */}
              <section className={`bg-neutral-900/20 p-4 md:p-6 rounded-3xl border border-neutral-900 ${mobileTab === 'projects' ? 'hidden xl:block' : 'block'}`}>
                <EisenhowerMatrix />
              </section>
            </div>

            {/* Right Column: Vault, Snippets, Calendar */}
            <div className={`xl:col-span-4 space-y-6 ${mobileTab === 'projects' || mobileTab === 'tasks' ? 'hidden xl:block' : 'block'}`}>
              
              {/* Tech Vault Section */}
              <motion.section 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900/40 p-5 md:p-6 rounded-3xl border border-neutral-900 backdrop-blur-xl ring-1 ring-white/5"
              >
                <Vault />
              </motion.section>

              {/* Snippet Manager */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/40 p-5 md:p-6 rounded-3xl border border-neutral-900"
              >
                <SnippetManager />
              </motion.section>

              {/* Deadlines */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/40 p-5 md:p-6 rounded-3xl border border-neutral-900"
              >
                <DeadlineCalendar />
              </motion.section>

              {/* Server Status Mobile View */}
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border-2 border-neutral-800 shadow-lg"
              >
                <div className="flex justify-between items-end mb-3">
                  <h3 className="text-xs font-black text-neutral-400 uppercase tracking-wider">WILLTECH CLOUD</h3>
                  <span className="text-xs font-mono font-bold text-lime-500 bg-lime-500/10 px-2 py-1 rounded border border-lime-500/20">STABLE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '94%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-lime-600 via-lime-500 to-lime-400 rounded-full shadow-lg shadow-lime-500/50"
                    ></motion.div>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">94%</span>
                </div>
              </motion.section>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION - MOBILE ONLY */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-950/80 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
          <button 
            onClick={() => setMobileTab('projects')}
            className={`p-3 rounded-xl transition-all ${mobileTab === 'projects' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-neutral-500'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button 
            onClick={() => setMobileTab('tasks')}
            className={`p-3 rounded-xl transition-all ${mobileTab === 'tasks' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-neutral-500'}`}
          >
            <BarChart3 size={20} />
          </button>
          
          <button 
            className="w-12 h-12 rounded-xl bg-neutral-900 text-lime-500 flex items-center justify-center border border-neutral-800"
          >
             <Plus size={24} />
          </button>

          <button 
            onClick={() => setMobileTab('vault')}
            className={`p-3 rounded-xl transition-all ${mobileTab === 'vault' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-neutral-500'}`}
          >
            <Lock size={20} />
          </button>
          <button 
            onClick={() => setMobileTab('config')}
            className={`p-3 rounded-xl transition-all ${mobileTab === 'config' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-neutral-500'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </main>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={addProject}
        onUpdate={updateProject}
        onDelete={deleteProject}
        project={editingProject}
      />
    </div>
  );
};

export default MainDashboard;
