
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { Calendar, AlertCircle, Bookmark, DollarSign, Plus } from 'lucide-react';
import { ProjectPayment } from '../types';
import { projectPaymentsService } from '../src/services/firestoreService';
import { motion, AnimatePresence } from 'framer-motion';

const DeadlineCalendar: React.FC = () => {
  const { deadlines, projects } = useApp();
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'payments'>('lifecycle');
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  useEffect(() => {
    if (activeTab === 'payments') {
      loadAllPayments();
    }
  }, [activeTab, projects]);

  const loadAllPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const allPayments: ProjectPayment[] = [];
      for (const project of projects) {
        try {
          const projectPayments = await projectPaymentsService.getByProjectId(project.id);
          allPayments.push(...projectPayments);
        } catch (error) {
          console.error(`Erro ao carregar pagamentos do projeto ${project.id}:`, error);
        }
      }
      // Ordenar por data de vencimento
      allPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setPayments(allPayments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
      full: date
    };
  };

  const isUrgent = (date: Date) => {
    const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  };

  const isOverdue = (date: Date) => {
    return date.getTime() < Date.now();
  };

  const getPaymentStatus = (payment: ProjectPayment) => {
    const dueDate = new Date(payment.dueDate);
    if (payment.status === 'paid') return 'paid';
    if (isOverdue(dueDate)) return 'overdue';
    if (isUrgent(dueDate)) return 'urgent';
    return 'pending';
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('lifecycle')}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'lifecycle'
              ? 'text-white border-lime-500'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            Lifecycle Calendar
          </div>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'payments'
              ? 'text-red-500 border-red-500'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={14} />
            Calendario de Pagamentos
          </div>
        </button>
      </div>

      {/* Lifecycle Calendar Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'lifecycle' && (
          <motion.div
            key="lifecycle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {deadlines.length > 0 ? (
              deadlines.map((deadline) => {
                const dateInfo = formatDate(deadline.date);
                const date = dateInfo.full;
                const urgent = isUrgent(date);
                const overdue = isOverdue(date);

                return (
                  <motion.div
                    key={deadline.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 p-3 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-950 border-2 border-neutral-800 hover:border-lime-500/50 transition-all"
                  >
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 ${
                      overdue 
                        ? 'border-red-500 bg-red-500/20' 
                        : urgent 
                        ? 'border-red-500/70 bg-red-500/10' 
                        : 'border-neutral-700 bg-neutral-950'
                    }`}>
                      <span className="text-[10px] uppercase font-black text-neutral-400">
                        {dateInfo.month}
                      </span>
                      <span className={`text-xl font-mono font-black ${
                        overdue || urgent ? 'text-red-500' : 'text-white'
                      }`}>
                        {dateInfo.day}
                      </span>
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-white">{deadline.title}</h4>
                        {(urgent || overdue) && (
                          <AlertCircle size={14} className="text-red-500 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-bold uppercase tracking-wider border border-neutral-700">
                          {deadline.projectId}
                        </span>
                        <span className="text-[9px] px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 flex items-center gap-1 border border-neutral-700">
                          <Bookmark size={10} /> {deadline.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-neutral-600 text-xs uppercase font-bold">
                Nenhum evento cadastrado
              </div>
            )}
            
            <div className="pt-3 text-[10px] text-neutral-600 font-mono text-center border-t border-neutral-800/50 italic">
              Viewing current contractual cycle
            </div>
          </motion.div>
        )}

        {/* Payment Calendar Content */}
        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {isLoadingPayments ? (
              <div className="text-center py-8 text-neutral-600 text-xs">
                Carregando pagamentos...
              </div>
            ) : payments.length > 0 ? (
              payments.map((payment) => {
                const dateInfo = formatDate(payment.dueDate);
                const date = dateInfo.full;
                const status = getPaymentStatus(payment);
                const project = projects.find(p => p.id === payment.projectId);

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-4 p-3 rounded-xl border-2 transition-all ${
                      status === 'overdue'
                        ? 'bg-red-500/10 border-red-500/50'
                        : status === 'urgent'
                        ? 'bg-yellow-500/10 border-yellow-500/50'
                        : status === 'paid'
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-gradient-to-r from-neutral-900 to-neutral-950 border-neutral-800 hover:border-red-500/50'
                    }`}
                  >
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 ${
                      status === 'overdue'
                        ? 'border-red-500 bg-red-500/20'
                        : status === 'urgent'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : status === 'paid'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-neutral-700 bg-neutral-950'
                    }`}>
                      <span className="text-[10px] uppercase font-black text-neutral-400">
                        {dateInfo.month}
                      </span>
                      <span className={`text-xl font-mono font-black ${
                        status === 'overdue' ? 'text-red-500' :
                        status === 'urgent' ? 'text-yellow-500' :
                        status === 'paid' ? 'text-green-500' :
                        'text-white'
                      }`}>
                        {dateInfo.day}
                      </span>
                    </div>
                    <div className="flex-1 py-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-white">{payment.title}</h4>
                        {(status === 'overdue' || status === 'urgent') && (
                          <AlertCircle size={14} className="text-red-500 animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {project && (
                          <span className="text-[9px] px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-bold uppercase tracking-wider border border-neutral-700">
                            {project.name}
                          </span>
                        )}
                        {payment.amount && (
                          <span className="text-[9px] px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 border border-neutral-700">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: payment.currency || 'BRL'
                            }).format(payment.amount)}
                          </span>
                        )}
                        {payment.isRecurring && (
                          <span className="text-[9px] px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Recorrente
                          </span>
                        )}
                        <span className={`text-[9px] px-2 py-1 rounded-lg font-bold ${
                          status === 'overdue' ? 'bg-red-500 text-white' :
                          status === 'paid' ? 'bg-green-500 text-white' :
                          status === 'urgent' ? 'bg-yellow-500 text-black' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          {status === 'overdue' ? 'VENCIDO' :
                           status === 'paid' ? 'PAGO' :
                           status === 'urgent' ? 'URGENTE' :
                           'PENDENTE'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-neutral-600 text-xs uppercase font-bold">
                Nenhum pagamento cadastrado
              </div>
            )}
            
            <div className="pt-3 text-[10px] text-neutral-600 font-mono text-center border-t border-neutral-800/50 italic">
              Viewing current payment cycle
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeadlineCalendar;
