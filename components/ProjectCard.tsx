import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Code2,
  GitCommitHorizontal,
  MoreHorizontal,
} from 'lucide-react';
import { Project, ProjectPayment, Task } from '../types';
import { projectPaymentsService } from '../src/services/firestoreService';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onOpen?: () => void;
  onEdit?: () => void;
}

const STATUS_LABEL: Record<Project['status'], string> = {
  Active: 'Ativo',
  Maintenance: 'Manutenção',
  Legacy: 'Legado',
};

const STATUS_CLASS: Record<Project['status'], string> = {
  Active: 'border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300',
  Maintenance: 'border-amber-400/15 bg-amber-400/[0.08] text-amber-300',
  Legacy: 'border-white/[0.07] bg-white/[0.035] text-neutral-500',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, tasks, onOpen, onEdit }) => {
  const pendingTasks = tasks.filter((task) => task.projectId === project.id && !task.isCompleted).length;
  const [pendingPayments, setPendingPayments] = useState<ProjectPayment[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const payments = await projectPaymentsService.getByProjectId(project.id);
        const today = new Date();
        const pending = payments.filter((payment) => {
          if (payment.status === 'paid') {
            if (payment.isRecurring && payment.recurringDay && payment.paidAt) {
              const paidDate = new Date(payment.paidAt);
              return today.getDate() >= payment.recurringDay && today.getMonth() !== paidDate.getMonth();
            }
            return false;
          }

          if (payment.isRecurring && payment.recurringDay) {
            return today.getDate() >= payment.recurringDay;
          }

          return new Date(payment.dueDate) <= today;
        });
        setPendingPayments(pending);
      } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
      }
    };

    void loadPayments();
    const interval = window.setInterval(loadPayments, 60000);
    return () => window.clearInterval(interval);
  }, [project.id]);

  const initials = project.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  const lastCommitLabel = project.ultimoCommit
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(
        new Date(`${project.ultimoCommit}T12:00:00`),
      )
    : null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen?.();
    }
  };

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      aria-label={`Abrir projeto ${project.name}`}
      className="project-card group relative min-h-[242px] cursor-pointer overflow-hidden rounded-[22px] border border-white/[0.075] p-5 outline-none transition focus-visible:border-emerald-400/40 focus-visible:ring-2 focus-visible:ring-emerald-400/15"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full opacity-[0.09] blur-[45px] transition group-hover:opacity-[0.16]"
        style={{ backgroundColor: project.color }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border text-[11px] font-bold tracking-[-0.02em]"
            style={{
              color: project.color,
              borderColor: `${project.color}30`,
              backgroundColor: `${project.color}12`,
            }}
          >
            {initials || 'WT'}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-neutral-100 transition group-hover:text-white">
              {project.name}
            </h3>
            <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-600">
              {project.type || 'Projeto digital'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`rounded-lg border px-2 py-1 text-[9px] font-semibold ${STATUS_CLASS[project.status]}`}>
            {STATUS_LABEL[project.status]}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              className="grid h-7 w-7 place-items-center rounded-lg text-neutral-700 opacity-0 transition hover:bg-white/[0.06] hover:text-neutral-300 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Editar ${project.name}`}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="relative mt-4 flex items-center gap-2.5 rounded-xl border border-rose-400/15 bg-rose-400/[0.055] px-3 py-2.5">
          <AlertTriangle size={14} className="shrink-0 text-rose-300" />
          <p className="min-w-0 flex-1 truncate text-[10px] font-medium text-rose-200/80">
            {pendingPayments.length === 1
              ? `${pendingPayments[0].title} requer atenção`
              : `${pendingPayments.length} pagamentos requerem atenção`}
          </p>
        </div>
      )}

      <div className="relative mt-5">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="text-neutral-600">Progresso do projeto</span>
          <span className="font-mono font-semibold text-neutral-300">{project.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.055]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(project.progress, 100))}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: project.color }}
          />
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t border-white/[0.055] pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] text-neutral-700">
            <Clock3 size={11} /> Pendentes
          </div>
          <p className="mt-1 text-xs font-medium text-neutral-300">{pendingTasks}</p>
        </div>
        <div className="min-w-0 border-l border-white/[0.055] pl-3">
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.1em] text-neutral-700">
            {lastCommitLabel ? <GitCommitHorizontal size={11} /> : <Code2 size={11} />}
            {lastCommitLabel ? 'Commit' : 'Stack'}
          </div>
          <p className="mt-1 truncate text-xs font-medium text-neutral-300">
            {lastCommitLabel || project.stack || 'Não informada'}
          </p>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.065] text-neutral-600 transition group-hover:border-emerald-400/15 group-hover:bg-emerald-400/[0.07] group-hover:text-emerald-300">
          {project.progress === 100 ? <CheckCircle2 size={14} /> : <ArrowUpRight size={14} />}
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;
