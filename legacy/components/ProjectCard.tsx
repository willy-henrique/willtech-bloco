
import React, { useState, useEffect } from 'react';
import { Project, Task, ProjectPayment } from '../types';
import { motion } from 'framer-motion';
import { Layers, Activity, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { projectPaymentsService } from '../src/services/firestoreService';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, tasks }) => {
  const pendingTasks = tasks.filter(t => t.projectId === project.id && !t.isCompleted).length;
  const [pendingPayments, setPendingPayments] = useState<ProjectPayment[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const payments = await projectPaymentsService.getByProjectId(project.id);
        // Filtrar apenas pagamentos pendentes ou vencidos
        const today = new Date();
        const pending = payments.filter(p => {
          if (p.status === 'paid') {
            // Se é recorrente e já foi pago, verificar se já passou o dia novamente
            if (p.isRecurring && p.recurringDay && p.paidAt) {
              const paidDate = new Date(p.paidAt);
              const currentDay = today.getDate();
              // Se já passou o dia do mês desde o último pagamento, mostrar como pendente
              if (currentDay >= p.recurringDay && today.getMonth() !== paidDate.getMonth()) {
                return true;
              }
            }
            return false;
          }
          
          // Se é recorrente, verificar se o dia do mês já chegou
          if (p.isRecurring && p.recurringDay) {
            const currentDay = today.getDate();
            return currentDay >= p.recurringDay;
          }
          
          // Para pagamentos não recorrentes, verificar data de vencimento
          const dueDate = new Date(p.dueDate);
          return dueDate <= today;
        });
        setPendingPayments(pending);
      } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
      }
    };
    loadPayments();
    // Atualizar a cada minuto para verificar se chegou o dia
    const interval = setInterval(loadPayments, 60000);
    return () => clearInterval(interval);
  }, [project.id]);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-lime-500/50 transition-colors duration-300 shadow-lg group overflow-hidden"
    >
      {/* Background Accent */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40" 
        style={{ backgroundColor: project.color }}
      ></div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-lime-400 transition-colors">
            {project.name}
          </h3>
          <p className="text-xs text-neutral-500 font-mono uppercase tracking-tighter mt-1">
            {project.type}
          </p>
        </div>
        <div className="px-2 py-1 rounded bg-neutral-800 text-[10px] font-bold text-neutral-400 uppercase tracking-widest border border-neutral-700">
          {project.status}
        </div>
      </div>

      {/* Alertas de Pagamento */}
      {pendingPayments.length > 0 && (
        <div className="mb-4 p-3 bg-red-500/10 border-2 border-red-500/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-red-500" />
            <span className="text-xs font-bold text-red-400 uppercase">Pagamento Pendente</span>
          </div>
          {pendingPayments.map(payment => (
            <div key={payment.id} className="text-xs text-red-300">
              {payment.title} {payment.isRecurring && payment.recurringDay && `(Dia ${payment.recurringDay})`}
              {payment.amount && ` - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: payment.currency || 'BRL' }).format(payment.amount)}`}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-neutral-400 flex items-center gap-1">
              <Activity size={12} /> Execution Progress
            </span>
            <span className="font-mono text-lime-400">{project.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: project.color }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/50">
            <div className="flex items-center gap-2 text-neutral-500 text-[10px] uppercase font-bold mb-1">
              <Clock size={10} className="text-lime-500" /> Pending
            </div>
            <div className="text-xl font-mono font-bold text-white">
              {pendingTasks.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/50">
            <div className="flex items-center gap-2 text-neutral-500 text-[10px] uppercase font-bold mb-1">
              <Layers size={10} className="text-blue-500" /> Stack
            </div>
            <div className="text-xs font-bold text-neutral-300 truncate">
              {project.stack || 'React/Node'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
