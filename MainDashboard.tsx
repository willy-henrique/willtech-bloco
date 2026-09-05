import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Blocks,
  CheckCircle2,
  ChevronRight,
  Code2,
  DownloadCloud,
  FileText,
  FolderKanban,
  Gauge,
  Import,
  ListTodo,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  WalletCards,
  X,
} from 'lucide-react';
import { useApp } from './AppContext';
import { useAuth } from './src/auth/AuthContext';
import CaptureChat from './src/features/capture/CaptureChat';
import ImportarProjetos from './src/features/projects/ImportarProjetos';
import { ordenarPorAtividade } from './src/features/projects/ordenarPorAtividade';
import AtualizarDoGitHub, { buscarAtividadeNoGitHub } from './src/features/projects/AtualizarDoGitHub';
import { projectPaymentsService, projectNotesService } from './src/services/firestoreService';
import GlobalNotes from './src/features/notes/GlobalNotes';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import ProjectDetails from './components/ProjectDetails';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import SnippetManager from './components/SnippetManager';
import DeadlineCalendar from './components/DeadlineCalendar';
import Vault from './components/Vault';
import FinanceHub from './components/FinanceHub';
import { Project, TaskPriority, type ProjectPayment, type ProjectNote } from './types';

type View = 'overview' | 'projects' | 'notes' | 'finance' | 'tasks' | 'vault' | 'resources';

const VIEW_META: Record<View, { title: string; eyebrow: string; description: string }> = {
  overview: {
    title: 'Visão geral',
    eyebrow: 'Central de operações',
    description: 'Projetos, prioridades e próximos movimentos em um só lugar.',
  },
  projects: {
    title: 'Projetos',
    eyebrow: 'Portfólio',
    description: 'Acompanhe o ritmo e entre rapidamente no contexto de cada produto.',
  },
  notes: {
    title: 'Anotações',
    eyebrow: 'Base de conhecimento',
    description: 'Anotações, atas e diretrizes dos seus projetos e gerais.',
  },
  tasks: {
    title: 'Prioridades',
    eyebrow: 'Planejamento',
    description: 'Decida o que fazer agora, agendar, delegar ou tirar do caminho.',
  },
  finance: {
    title: 'Finanças',
    eyebrow: 'Finance Hub',
    description: 'Liquidez, compromissos e metas financeiras da operação.',
  },
  vault: {
    title: 'Cofre',
    eyebrow: 'Acesso seguro',
    description: 'Credenciais e segredos organizados por tipo, sempre à mão.',
  },
  resources: {
    title: 'Base técnica',
    eyebrow: 'Recursos',
    description: 'Snippets reutilizáveis, consultas e agenda contratual.',
  },
};

const PRIMARY_NAV: Array<{ view: View; label: string; icon: typeof Gauge }> = [
  { view: 'overview', label: 'Visão geral', icon: Gauge },
  { view: 'projects', label: 'Projetos', icon: FolderKanban },
  { view: 'notes', label: 'Anotações', icon: FileText },
  { view: 'finance', label: 'Finanças', icon: WalletCards },
  { view: 'tasks', label: 'Prioridades', icon: ListTodo },
];

const WORKSPACE_NAV: Array<{ view: View; label: string; icon: typeof Gauge }> = [
  { view: 'vault', label: 'Cofre', icon: LockKeyhole },
  { view: 'resources', label: 'Base técnica', icon: Code2 },
];

const MainDashboard: React.FC = () => {
  const {
    projects,
    tasks,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    toggleTask,
    dataError,
    clearDataError,
  } = useApp();
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<View>('overview');
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState('');
  // Carregado UMA vez e distribuido aos cards, em vez de cada card consultar.
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [allNotes, setAllNotes] = useState<ProjectNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const loadAllNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const lista = await projectNotesService.getAll();
      setAllNotes(lista);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    loadAllNotes();
  }, []);

  useEffect(() => {
    let ativo = true;
    projectPaymentsService
      .getAll()
      .then((lista) => { if (ativo) setPayments(lista); })
      .catch((erro) => console.error('Erro ao carregar pagamentos:', erro));
    return () => { ativo = false; };
  }, []);

  const openTasks = useMemo(() => tasks.filter((task) => !task.isCompleted), [tasks]);
  const attentionTasks = useMemo(
    () =>
      openTasks.filter(
        (task) => task.priority === TaskPriority.CRITICAL || task.priority === TaskPriority.URGENT,
      ),
    [openTasks],
  );
  const averageProgress = useMemo(
    () =>
      projects.length
        ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
        : 0,
    [projects],
  );
  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === 'Active').length,
    [projects],
  );
  const visibleProjects = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLocaleLowerCase('pt-BR');

    const filtrados = normalizedQuery
      ? projects.filter((project) =>
          [project.name, project.type, project.stack, project.repo]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase('pt-BR').includes(normalizedQuery)),
        )
      : projects;

    // Quem mexeu mais nos últimos 30 dias sobe.
    return ordenarPorAtividade(filtrados);
  }, [projectQuery, projects]);
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const userName = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Will';
  const userInitial = userName.charAt(0).toUpperCase();
  const currentDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  const navigateTo = (view: View) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const openNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const renderProjectGrid = (limit?: number) => {
    const items = typeof limit === 'number' ? visibleProjects.slice(0, limit) : visibleProjects;

    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-[22px] border border-white/5 bg-white/[0.025]" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.018] px-6 text-center">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-neutral-500">
            <Search size={19} />
          </div>
          <h3 className="text-sm font-semibold text-neutral-200">Nenhum projeto encontrado</h3>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">
            Ajuste a busca ou crie um novo projeto para começar.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.045, 0.2) }}
          >
            <ProjectCard
              project={project}
              tasks={tasks}
              payments={payments}
              onOpen={() => setSelectedProjectId(project.id)}
              onEdit={() => {
                setEditingProject(project);
                setIsProjectModalOpen(true);
              }}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  const handleAddGlobalNote = async (note: Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    await projectNotesService.create(note);
    await loadAllNotes();
  };

  const handleUpdateGlobalNote = async (id: string, updates: Partial<ProjectNote>) => {
    await projectNotesService.update(id, updates);
    await loadAllNotes();
  };

  const handleDeleteGlobalNote = async (id: string) => {
    await projectNotesService.delete(id);
    await loadAllNotes();
  };

  if (selectedProject) {
    return (
      <>
        <ProjectDetails
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
          onConfigure={() => {
            setEditingProject(selectedProject);
            setIsProjectModalOpen(true);
          }}
          onRefreshUpdates={async () => {
            if (!selectedProject.repo) {
              throw new Error('Configure o repositório GitHub deste projeto primeiro.');
            }
            const resultados = await buscarAtividadeNoGitHub([selectedProject.repo]);
            const resultado = resultados.find((item) => item.repo === selectedProject.repo);
            if (!resultado) {
              throw new Error('O GitHub não devolveu informações para este projeto.');
            }
            if (!resultado.ok) {
              throw new Error(resultado.erro || 'Não foi possível consultar este repositório.');
            }
            await updateProject(selectedProject.id, {
              ultimoCommit: resultado.ultimoCommit,
              evolucoes30d: resultado.evolucoes30d,
              correcoes30d: resultado.correcoes30d,
              historico: resultado.historico,
            });
          }}
        />
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={addProject}
          onUpdate={updateProject}
          onDelete={async (id) => {
            await deleteProject(id);
            setSelectedProjectId(null);
          }}
          project={editingProject}
        />
      </>
    );
  }

  const meta = VIEW_META[activeView];
  const navItems = [...PRIMARY_NAV, ...WORKSPACE_NAV];

  return (
    <div className="app-shell flex h-dvh overflow-hidden text-neutral-100">
      <aside className="relative z-30 hidden w-[260px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0b0e0d]/95 px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="brand-mark grid h-10 w-10 place-items-center rounded-[14px] text-[#07110c] shadow-[0_10px_30px_rgba(68,214,142,0.16)]">
            <Blocks size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">WillTech</span>
              <span className="rounded-md border border-emerald-400/15 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.18em] text-emerald-300">
                OPS
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-neutral-600">Workspace pessoal</p>
          </div>
        </div>

        <div className="mt-7 px-1">
          <button
            type="button"
            onClick={() => setIsCaptureOpen(true)}
            className="group flex w-full items-center gap-3 rounded-[14px] bg-emerald-300 px-3.5 py-3 text-left text-[13px] font-semibold text-[#07110c] shadow-[0_10px_30px_rgba(68,214,142,0.12)] transition hover:bg-emerald-200"
          >
            <Sparkles size={16} />
            <span className="flex-1">Captura rápida</span>
            <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[9px] font-bold">+</span>
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto px-1">
          <div>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-700">
              Operação
            </p>
            <div className="space-y-1">
              {PRIMARY_NAV.map(({ view, label, icon: Icon }) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => navigateTo(view)}
                  className={`sidebar-nav-item ${activeView === view ? 'is-active' : ''}`}
                >
                  <Icon size={17} strokeWidth={activeView === view ? 2.3 : 1.8} />
                  <span>{label}</span>
                  {view === 'tasks' && openTasks.length > 0 && (
                    <span className="ml-auto rounded-md bg-white/[0.055] px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500">
                      {openTasks.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-700">
              Workspace
            </p>
            <div className="space-y-1">
              {WORKSPACE_NAV.map(({ view, label, icon: Icon }) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => navigateTo(view)}
                  className={`sidebar-nav-item ${activeView === view ? 'is-active' : ''}`}
                >
                  <Icon size={17} strokeWidth={activeView === view ? 2.3 : 1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="flex items-center gap-3 rounded-2xl px-2 py-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-400/15 bg-emerald-400/10 text-xs font-semibold text-emerald-300">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-neutral-200">{userName}</p>
              <p className="mt-0.5 truncate text-[10px] text-neutral-600">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sair"
              aria-label="Sair"
              className="rounded-lg p-2 text-neutral-600 transition hover:bg-red-400/10 hover:text-red-300"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fechar menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[320px] flex-col border-r border-white/10 bg-[#0b0e0d] p-5 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="brand-mark grid h-10 w-10 place-items-center rounded-[14px] text-[#07110c]">
                    <Blocks size={20} />
                  </div>
                  <span className="text-base font-semibold text-white">WillTech</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl border border-white/[0.07] p-2 text-neutral-400"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-8 flex-1 space-y-1">
                {navItems.map(({ view, label, icon: Icon }) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => navigateTo(view)}
                    className={`sidebar-nav-item ${activeView === view ? 'is-active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-3 text-sm text-neutral-400"
              >
                <LogOut size={17} /> Sair da conta
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-20 shrink-0 border-b border-white/[0.065] bg-[#0d100f]/80 px-4 py-3 backdrop-blur-xl md:px-7 lg:px-9 lg:py-4">
          <div className="mx-auto flex max-w-[1540px] items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Abrir menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-neutral-300 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600 sm:flex">
                <span>{meta.eyebrow}</span>
                <ChevronRight size={11} />
                <span className="text-emerald-300/80">{meta.title}</span>
              </div>
              <h1 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-white sm:mt-0.5 lg:text-[19px]">
                {meta.title}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setIsCaptureOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-2.5 text-xs font-medium text-neutral-300 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.07] hover:text-white sm:flex"
            >
              <Sparkles size={15} className="text-emerald-300" />
              Capturar ideia
              <span className="ml-2 hidden rounded-md border border-white/[0.07] px-1.5 py-0.5 text-[9px] text-neutral-600 xl:inline">rápido</span>
            </button>
            <button
              type="button"
              onClick={openNewProject}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-3.5 text-xs font-semibold text-[#08110d] transition hover:bg-emerald-200"
            >
              <Plus size={16} />
              <span className="hidden md:inline">Novo projeto</span>
            </button>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1540px] px-4 pb-48 pt-4 md:px-7 md:pt-8 lg:px-9 lg:pb-10">
            {dataError && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-100">
                <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={17} />
                <p className="min-w-0 flex-1 leading-5">{dataError}</p>
                <button type="button" onClick={clearDataError} aria-label="Fechar aviso" className="rounded-lg p-1 text-amber-200/60 transition hover:bg-amber-300/10 hover:text-amber-100">
                  <X size={15} />
                </button>
              </div>
            )}
            {activeView === 'overview' && (
              <div className="space-y-6 md:space-y-8">
                <section className="overview-hero relative overflow-hidden rounded-[28px] border border-white/[0.075] px-5 py-6 md:px-7 md:py-7">
                  <div className="hero-orb" />
                  <div className="relative z-10 flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
                    <div className="max-w-2xl">
                      <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                        {currentDate}
                      </div>
                      <h2 className="max-w-xl text-[28px] font-semibold leading-[1.08] tracking-[-0.045em] text-white md:text-[38px]">
                        Bom trabalho, {userName.split(' ')[0]}. <span className="text-neutral-500">Sua operação está aqui.</span>
                      </h2>
                      <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-400 md:text-[15px]">
                        Você tem <strong className="font-medium text-neutral-200">{openTasks.length} tarefas abertas</strong>
                        {attentionTasks.length > 0
                          ? `, sendo ${attentionTasks.length} que pedem atenção primeiro.`
                          : ' e nenhuma prioridade crítica agora.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsCaptureOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-semibold text-[#07110c] transition hover:bg-emerald-200"
                      >
                        <Sparkles size={15} /> Capturar tarefa
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsImportOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-xs font-medium text-neutral-300 transition hover:bg-white/[0.07] hover:text-white"
                      >
                        <Import size={15} /> Importar projetos
                      </button>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {[
                    { label: 'Projetos ativos', value: activeProjects, icon: FolderKanban, tone: 'emerald', note: `${projects.length} no total` },
                    { label: 'Tarefas abertas', value: openTasks.length, icon: ListTodo, tone: 'violet', note: `${tasks.length - openTasks.length} concluídas` },
                    { label: 'Progresso médio', value: `${averageProgress}%`, icon: Target, tone: 'blue', note: 'do portfólio' },
                    { label: 'Pedem atenção', value: attentionTasks.length, icon: ShieldCheck, tone: 'amber', note: attentionTasks.length ? 'críticas ou urgentes' : 'tudo sob controle' },
                  ].map(({ label, value, icon: Icon, tone, note }) => (
                    <div key={label} className="metric-card rounded-[20px] border border-white/[0.065] p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-medium text-neutral-500">{label}</p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white md:text-[28px]">{value}</p>
                        </div>
                        <div className={`metric-icon metric-icon-${tone}`}>
                          <Icon size={16} />
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] text-neutral-600">{note}</p>
                    </div>
                  ))}
                </section>

                <div className="grid items-start gap-6 xl:grid-cols-12">
                  <section className="xl:col-span-8">
                    <SectionHeading
                      eyebrow="Portfólio"
                      title="Projetos em movimento"
                      description="Abra um projeto para acessar notas, pagamentos e credenciais."
                      action={
                        <button
                          type="button"
                          onClick={() => navigateTo('projects')}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-emerald-300"
                        >
                          Ver todos <ArrowRight size={14} />
                        </button>
                      }
                    />
                    {renderProjectGrid(4)}
                  </section>

                  <div className="space-y-6 xl:col-span-4">
                    <section className="surface-panel overflow-hidden rounded-[22px] border border-white/[0.07]">
                      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-600">Próximo passo</p>
                          <h3 className="mt-1 text-sm font-semibold text-neutral-200">Fila de atenção</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateTo('tasks')}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-neutral-500 transition hover:text-emerald-300"
                          aria-label="Abrir prioridades"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                      <div className="divide-y divide-white/[0.055]">
                        {attentionTasks.slice(0, 5).map((task) => {
                          const project = projects.find((item) => item.id === task.projectId);
                          const isCritical = task.priority === TaskPriority.CRITICAL;
                          return (
                            <div key={task.id} className="group flex items-start gap-3 px-5 py-3.5">
                              <button
                                type="button"
                                onClick={() => toggleTask(task.id)}
                                aria-label="Concluir tarefa"
                                className="mt-0.5 text-neutral-700 transition hover:text-emerald-300"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-xs leading-5 text-neutral-300">{task.description}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${isCritical ? 'bg-rose-400' : 'bg-amber-300'}`} />
                                  <span className="truncate text-[9px] font-medium uppercase tracking-[0.12em] text-neutral-600">
                                    {project?.name || task.projectId}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {attentionTasks.length === 0 && (
                          <div className="px-5 py-8 text-center">
                            <CheckCircle2 className="mx-auto text-emerald-300/70" size={22} />
                            <p className="mt-3 text-xs font-medium text-neutral-300">Fila sob controle</p>
                            <p className="mt-1 text-[11px] text-neutral-600">Nada crítico ou urgente agora.</p>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="surface-panel rounded-[22px] border border-white/[0.07] p-5">
                      <DeadlineCalendar compact />
                    </section>
                  </div>
                </div>
              </div>
            )}

            {activeView === 'projects' && (
              <section>
                <PageIntro meta={meta} />
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
                    <input
                      type="search"
                      value={projectQuery}
                      onChange={(event) => setProjectQuery(event.target.value)}
                      placeholder="Buscar por nome, stack ou repositório..."
                      className="h-11 w-full rounded-xl border border-white/[0.075] bg-white/[0.025] pl-10 pr-4 text-xs text-neutral-200 outline-none transition placeholder:text-neutral-700 focus:border-emerald-400/25 focus:bg-emerald-400/[0.025]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImportOpen(true)}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.075] px-4 text-xs font-medium text-neutral-400 transition hover:bg-white/[0.04] hover:text-white sm:flex-none"
                    >
                      <DownloadCloud size={16} /> Importar
                    </button>
                    <AtualizarDoGitHub />
                    <button
                      type="button"
                      onClick={openNewProject}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 text-xs font-semibold text-[#07110c] transition hover:bg-emerald-200 sm:flex-none"
                    >
                      <Plus size={16} /> Novo projeto
                    </button>
                  </div>
                </div>
                {renderProjectGrid()}
              </section>
            )}

            {activeView === 'notes' && (
              <section>
                <PageIntro meta={meta} />
                <GlobalNotes
                  projects={projects}
                  notes={allNotes}
                  isLoading={isLoadingNotes}
                  onAddNote={handleAddGlobalNote}
                  onUpdateNote={handleUpdateGlobalNote}
                  onDeleteNote={handleDeleteGlobalNote}
                  onOpenProject={(id) => setSelectedProjectId(id)}
                />
              </section>
            )}

            {activeView === 'tasks' && (
              <section>
                <PageIntro meta={meta} />
                <div className="surface-panel rounded-[24px] border border-white/[0.07] p-4 md:p-6">
                  <EisenhowerMatrix />
                </div>
              </section>
            )}

            {activeView === 'finance' && (
              <section>
                <PageIntro meta={meta} />
                <FinanceHub embedded />
              </section>
            )}

            {activeView === 'vault' && (
              <section>
                <PageIntro meta={meta} />
                <div className="surface-panel mx-auto max-w-5xl rounded-[24px] border border-white/[0.07] p-5 md:p-7">
                  <Vault expanded />
                </div>
              </section>
            )}

            {activeView === 'resources' && (
              <section>
                <PageIntro meta={meta} />
                <div className="grid items-start gap-5 xl:grid-cols-12">
                  <div className="surface-panel rounded-[24px] border border-white/[0.07] p-5 md:p-6 xl:col-span-7">
                    <SnippetManager />
                  </div>
                  <div className="surface-panel rounded-[24px] border border-white/[0.07] p-5 md:p-6 xl:col-span-5">
                    <DeadlineCalendar />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <nav className="mobile-bottom-nav fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-[22px] border border-white/[0.1] bg-[#0d100f]/95 px-2 py-2 shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:hidden">
          <MobileNavButton active={activeView === 'overview'} label="Início" onClick={() => navigateTo('overview')} icon={Gauge} />
          <MobileNavButton active={activeView === 'projects'} label="Projetos" onClick={() => navigateTo('projects')} icon={FolderKanban} />
          <button
            type="button"
            onClick={() => setIsCaptureOpen(true)}
            aria-label="Captura rápida"
            className="mx-1 -mt-4 grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[4px] border-[#0d100f] bg-emerald-300 text-[#07110c] shadow-[0_8px_20px_rgba(52,211,153,0.3)] transition active:scale-95"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
          <MobileNavButton active={activeView === 'notes'} label="Anotações" onClick={() => navigateTo('notes')} icon={FileText} />
          <MobileNavButton active={activeView === 'finance'} label="Finanças" onClick={() => navigateTo('finance')} icon={WalletCards} />
        </nav>
      </main>

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
      <CaptureChat open={isCaptureOpen} onClose={() => setIsCaptureOpen(false)} />
      <ImportarProjetos open={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
};

const SectionHeading: React.FC<{
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ eyebrow, title, description, action }) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-300/65">{eyebrow}</p>
      <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.025em] text-white">{title}</h2>
      {description && <p className="mt-1 text-xs text-neutral-600">{description}</p>}
    </div>
    {action}
  </div>
);

const PageIntro: React.FC<{ meta: (typeof VIEW_META)[View] }> = ({ meta }) => (
  <div className="mb-6 md:mb-8">
    <p className="text-[9px] font-bold uppercase tracking-[0.21em] text-emerald-300/65">{meta.eyebrow}</p>
    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white md:text-[30px]">{meta.title}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{meta.description}</p>
  </div>
);

const MobileNavButton: React.FC<{
  active: boolean;
  label: string;
  onClick: () => void;
  icon: typeof Gauge;
}> = ({ active, label, onClick, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition ${
      active ? 'text-emerald-300 font-semibold' : 'text-neutral-500 hover:text-neutral-300'
    }`}
  >
    <div className={`grid h-8 w-11 place-items-center rounded-xl transition ${active ? 'bg-emerald-400/15' : 'bg-transparent'}`}>
      <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
    </div>
    <span className="text-[10px] leading-tight tracking-tight truncate">{label}</span>
  </button>
);

export default MainDashboard;

