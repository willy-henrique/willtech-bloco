
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Edit2, Trash2, Lock, DollarSign, FileText,
  Calendar, AlertCircle, CheckCircle, XCircle, Copy, Eye, EyeOff,
  Globe, Code, User, Mail, Key, Link as LinkIcon, Save, X, Download
} from 'lucide-react';
import { Project, ProjectCredential, ProjectPayment, ProjectNote, ProjectDetail } from '../types';
import {
  projectCredentialsService,
  projectPaymentsService,
  projectNotesService,
  projectDetailsService
} from '../src/services/firestoreService';
import EnvEditor from './EnvEditor';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onBack }) => {
  const [credentials, setCredentials] = useState<ProjectCredential[]>([]);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'credentials' | 'payments' | 'notes' | 'info'>('credentials');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);

  // Form states
  const [credentialForm, setCredentialForm] = useState<Partial<ProjectCredential>>({});
  const [paymentForm, setPaymentForm] = useState<Partial<ProjectPayment>>({});
  const [noteForm, setNoteForm] = useState<Partial<ProjectNote>>({});
  const [detailForm, setDetailForm] = useState<Partial<ProjectDetail>>({});

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [creds, pays, nots, det] = await Promise.all([
        projectCredentialsService.getByProjectId(project.id).catch(() => []),
        projectPaymentsService.getByProjectId(project.id).catch(() => []),
        projectNotesService.getByProjectId(project.id).catch(() => []),
        projectDetailsService.getByProjectId(project.id).catch(() => null)
      ]);
      setCredentials(creds);
      setPayments(pays);
      setNotes(nots);
      setDetail(det);
      if (det) setDetailForm(det);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar pagamentos vencidos
  const getPaymentStatus = (payment: ProjectPayment): 'pending' | 'paid' | 'overdue' => {
    if (payment.status === 'paid') {
      // Se é recorrente e já passou o dia novamente, voltar para overdue
      if (payment.isRecurring && payment.recurringDay && payment.paidAt) {
        const today = new Date();
        const paidDate = new Date(payment.paidAt);
        const currentDay = today.getDate();
        
        // Se já passou o dia do mês e é um mês diferente do último pagamento
        if (currentDay >= payment.recurringDay && 
            (today.getMonth() !== paidDate.getMonth() || today.getFullYear() !== paidDate.getFullYear())) {
          return 'overdue';
        }
      }
      return 'paid';
    }
    
    const today = new Date();
    
    // Se é recorrente, verificar se o dia do mês já chegou
    if (payment.isRecurring && payment.recurringDay) {
      const currentDay = today.getDate();
      if (currentDay >= payment.recurringDay) {
        return 'overdue';
      }
      return 'pending';
    }
    
    // Para pagamentos não recorrentes
    const due = new Date(payment.dueDate);
    if (due < today) return 'overdue';
    return 'pending';
  };

  const updatePaymentStatuses = () => {
    setPayments(prev => prev.map(p => {
      const newStatus = getPaymentStatus(p);
      return { ...p, status: newStatus };
    }));
  };

  useEffect(() => {
    if (payments.length > 0) {
      updatePaymentStatuses();
      const interval = setInterval(updatePaymentStatuses, 60000); // Atualizar a cada minuto
      return () => clearInterval(interval);
    }
  }, [payments.length]);

  // Credenciais
  const handleSaveCredential = async () => {
    try {
      if (editingItem) {
        await projectCredentialsService.update(editingItem, credentialForm);
      } else {
        await projectCredentialsService.create({
          projectId: project.id,
          title: credentialForm.title || '',
          username: credentialForm.username,
          email: credentialForm.email,
          password: credentialForm.password,
          url: credentialForm.url,
          env: credentialForm.env,
          notes: credentialForm.notes
        } as Omit<ProjectCredential, 'id' | 'createdAt'>);
      }
      setCredentialForm({});
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar credencial:', error);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta credencial?')) {
      await projectCredentialsService.delete(id);
      loadData();
    }
  };

  // Pagamentos
  const handleSavePayment = async () => {
    try {
      let dueDate = paymentForm.dueDate || new Date().toISOString().split('T')[0];
      
      // Se é recorrente, calcular a próxima data baseada no dia do mês
      if (paymentForm.isRecurring && paymentForm.recurringDay) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = paymentForm.recurringDay;
        
        // Se o dia já passou este mês, usar próximo mês
        if (today.getDate() >= day) {
          const nextMonth = new Date(year, month + 1, day);
          dueDate = nextMonth.toISOString().split('T')[0];
        } else {
          const thisMonth = new Date(year, month, day);
          dueDate = thisMonth.toISOString().split('T')[0];
        }
      }
      
      // Criar objeto temporário para calcular status
      const tempPayment: ProjectPayment = {
        id: editingItem || '',
        projectId: project.id,
        title: paymentForm.title || '',
        dueDate,
        amount: paymentForm.amount,
        currency: paymentForm.currency || 'BRL',
        status: paymentForm.status || 'pending',
        isRecurring: paymentForm.isRecurring,
        recurringDay: paymentForm.recurringDay,
        createdAt: Date.now()
      };
      const status = getPaymentStatus(tempPayment);
      
      if (editingItem) {
        await projectPaymentsService.update(editingItem, { ...paymentForm, dueDate, status });
      } else {
        await projectPaymentsService.create({
          projectId: project.id,
          title: paymentForm.title || '',
          dueDate,
          amount: paymentForm.amount,
          currency: paymentForm.currency || 'BRL',
          status,
          isRecurring: paymentForm.isRecurring || false,
          recurringDay: paymentForm.recurringDay,
          notes: paymentForm.notes
        } as Omit<ProjectPayment, 'id' | 'createdAt'>);
      }
      setPaymentForm({});
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      // Se é recorrente, calcular próxima data de vencimento
      if (payment.isRecurring && payment.recurringDay) {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, payment.recurringDay);
        const nextDueDate = nextMonth.toISOString().split('T')[0];
        
        await projectPaymentsService.update(paymentId, { 
          status: 'paid',
          paidAt: Date.now(),
          dueDate: nextDueDate
        });
      } else {
        await projectPaymentsService.update(paymentId, { 
          status: 'paid',
          paidAt: Date.now()
        });
      }
      loadData();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este pagamento?')) {
      await projectPaymentsService.delete(id);
      loadData();
    }
  };

  // Notas
  const handleSaveNote = async () => {
    try {
      if (editingItem) {
        await projectNotesService.update(editingItem, noteForm);
      } else {
        await projectNotesService.create({
          projectId: project.id,
          title: noteForm.title || '',
          content: noteForm.content || '',
          category: noteForm.category
        } as Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setNoteForm({});
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta nota?')) {
      await projectNotesService.delete(id);
      loadData();
    }
  };

  // Detalhes
  const handleSaveDetail = async () => {
    try {
      await projectDetailsService.createOrUpdate({
        projectId: project.id,
        description: detailForm.description,
        clientName: detailForm.clientName,
        clientContact: detailForm.clientContact,
        repositoryUrl: detailForm.repositoryUrl,
        productionUrl: detailForm.productionUrl,
        stagingUrl: detailForm.stagingUrl
      } as Omit<ProjectDetail, 'createdAt' | 'updatedAt'>);
      setIsEditingDetail(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const isDateOverdue = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const daysUntilDue = (dateString: string) => {
    const today = new Date();
    const due = new Date(dateString);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-neutral-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <p className="text-neutral-400">{project.type}</p>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="px-3 py-1 rounded-lg text-xs font-bold uppercase"
              style={{ backgroundColor: project.color + '20', color: project.color }}
            >
              {project.status}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 md:mb-6 border-b border-neutral-800 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
        {[
          { id: 'credentials', label: 'Credenciais', icon: Lock, shortLabel: 'Creds' },
          { id: 'payments', label: 'Pagamentos', icon: DollarSign, shortLabel: 'Pags' },
          { id: 'notes', label: 'Notas', icon: FileText, shortLabel: 'Notas' },
          { id: 'info', label: 'Informações', icon: Globe, shortLabel: 'Info' }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-lime-500 text-lime-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Icon size={14} className="sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">{tab.label}</span>
              <span className="text-xs sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* CREDENCIAIS */}
        {activeTab === 'credentials' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Credenciais de Desenvolvimento</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setCredentialForm({});
                }}
                className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Nova Credencial
              </button>
            </div>

            {/* Form */}
            {(editingItem || Object.keys(credentialForm).length > 0) && (
              <div className="mb-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  placeholder="Título (ex: Admin, Dev, Staging)"
                  value={credentialForm.title || ''}
                  onChange={(e) => setCredentialForm({ ...credentialForm, title: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Usuário"
                    value={credentialForm.username || ''}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={credentialForm.email || ''}
                    onChange={(e) => setCredentialForm({ ...credentialForm, email: e.target.value })}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  />
                </div>
                <div className="mb-3 relative">
                  <input
                    type={showPassword[editingItem || 'new'] ? 'text' : 'password'}
                    placeholder="Senha"
                    value={credentialForm.password || ''}
                    onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, [editingItem || 'new']: !showPassword[editingItem || 'new'] })}
                    className="absolute right-2 top-2 text-neutral-400 hover:text-white"
                  >
                    {showPassword[editingItem || 'new'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="URL (opcional)"
                  value={credentialForm.url || ''}
                  onChange={(e) => setCredentialForm({ ...credentialForm, url: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <div className="mb-3">
                  <EnvEditor
                    value={credentialForm.env || ''}
                    onChange={(value) => setCredentialForm({ ...credentialForm, env: value })}
                    placeholder="Cole aqui o conteúdo do arquivo .env do projeto..."
                  />
                </div>
                <textarea
                  placeholder="Notas adicionais (opcional)"
                  value={credentialForm.notes || ''}
                  onChange={(e) => setCredentialForm({ ...credentialForm, notes: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCredential}
                    className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setCredentialForm({});
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg font-bold hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-3">
              {credentials.map(cred => (
                <div key={cred.id} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{cred.title}</h3>
                      <div className="space-y-1 text-sm text-neutral-400">
                        {cred.username && (
                          <div className="flex items-center gap-2">
                            <User size={14} />
                            <span>{cred.username}</span>
                            <button onClick={() => copyToClipboard(cred.username!)} className="text-lime-500 hover:text-lime-400">
                              <Copy size={12} />
                            </button>
                          </div>
                        )}
                        {cred.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span>{cred.email}</span>
                            <button onClick={() => copyToClipboard(cred.email!)} className="text-lime-500 hover:text-lime-400">
                              <Copy size={12} />
                            </button>
                          </div>
                        )}
                        {cred.password && (
                          <div className="flex items-center gap-2">
                            <Key size={14} />
                            <span>{showPassword[cred.id] ? cred.password : '••••••••'}</span>
                            <button onClick={() => setShowPassword({ ...showPassword, [cred.id]: !showPassword[cred.id] })} className="text-lime-500 hover:text-lime-400">
                              {showPassword[cred.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button onClick={() => copyToClipboard(cred.password!)} className="text-lime-500 hover:text-lime-400">
                              <Copy size={12} />
                            </button>
                          </div>
                        )}
                        {cred.url && (
                          <div className="flex items-center gap-2">
                            <LinkIcon size={14} />
                            <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:underline">
                              {cred.url}
                            </a>
                          </div>
                        )}
                      </div>
                      {cred.env && (
                        <div className="mt-3">
                          <EnvEditor
                            value={cred.env}
                            readOnly={true}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(cred.id);
                          setCredentialForm(cred);
                        }}
                        className="p-2 text-neutral-400 hover:text-lime-500 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCredential(cred.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {cred.notes && (
                    <p className="text-xs text-neutral-500 mt-2">{cred.notes}</p>
                  )}
                </div>
              ))}
              {credentials.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  Nenhuma credencial cadastrada. Clique em "Nova Credencial" para adicionar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGAMENTOS */}
        {activeTab === 'payments' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Pagamentos e Contratos</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setPaymentForm({ dueDate: new Date().toISOString().split('T')[0], status: 'pending' });
                }}
                className="w-full sm:w-auto px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Novo Pagamento
              </button>
            </div>

            {/* Form */}
            {(editingItem || Object.keys(paymentForm).length > 0) && (
              <div className="mb-6 p-4 md:p-6 bg-neutral-900 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  placeholder="Título (ex: Mensalidade, Contrato Anual)"
                  value={paymentForm.title || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <input
                    type="date"
                    value={paymentForm.dueDate || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                    disabled={paymentForm.isRecurring}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <input
                    type="number"
                    placeholder="Valor"
                    value={paymentForm.amount || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  />
                  <select
                    value={paymentForm.currency || 'BRL'}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-lime-500"
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="mb-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentForm.isRecurring || false}
                      onChange={(e) => setPaymentForm({ ...paymentForm, isRecurring: e.target.checked })}
                      className="w-4 h-4 text-lime-500 bg-neutral-800 border-neutral-700 rounded focus:ring-lime-500"
                    />
                    <span className="text-sm text-neutral-300">Pagamento recorrente (mensal)</span>
                  </label>
                  {paymentForm.isRecurring && (
                    <div className="mt-3">
                      <label className="block text-xs text-neutral-400 mb-1">Dia do mês</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Ex: 4 (dia 04)"
                        value={paymentForm.recurringDay || ''}
                        onChange={(e) => setPaymentForm({ ...paymentForm, recurringDay: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  )}
                </div>
                <textarea
                  placeholder="Notas (opcional)"
                  value={paymentForm.notes || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  rows={2}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSavePayment}
                    className="flex-1 px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setPaymentForm({});
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg font-bold hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-3">
              {payments.map(payment => {
                const status = getPaymentStatus(payment);
                const overdue = status === 'overdue';
                const days = daysUntilDue(payment.dueDate);
                
                return (
                  <div
                    key={payment.id}
                    className={`p-4 md:p-5 rounded-xl border-2 transition-all ${
                      status === 'overdue' || (payment.isRecurring && payment.recurringDay && new Date().getDate() >= payment.recurringDay && status !== 'paid')
                        ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/20'
                        : status === 'paid'
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base md:text-lg font-bold text-white">{payment.title}</h3>
                          {payment.isRecurring && payment.recurringDay && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold border border-blue-500/30">
                              Recorrente (Dia {payment.recurringDay})
                            </span>
                          )}
                          {status === 'overdue' && (
                            <span className="px-2 py-1 bg-red-500 text-white rounded text-xs font-bold flex items-center gap-1">
                              <AlertCircle size={12} />
                              VENCIDO
                            </span>
                          )}
                          {status === 'paid' && (
                            <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold flex items-center gap-1">
                              <CheckCircle size={12} />
                              PAGO
                            </span>
                          )}
                          {status === 'pending' && !overdue && (
                            <span className="px-2 py-1 bg-yellow-500 text-black rounded text-xs font-bold">
                              {days > 0 ? `Vence em ${days} dias` : 'Vence hoje'}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-neutral-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Vencimento: {formatDate(payment.dueDate)}</span>
                          </div>
                          {payment.amount && (
                            <div className="flex items-center gap-2">
                              <DollarSign size={14} />
                              <span className="font-bold text-white">{formatCurrency(payment.amount, payment.currency)}</span>
                            </div>
                          )}
                          {payment.paidAt && (
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle size={14} />
                              <span>Pago em: {formatDate(new Date(payment.paidAt).toISOString().split('T')[0])}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(payment.id)}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={14} />
                            Marcar como Pago
                          </button>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(payment.id);
                              setPaymentForm(payment);
                            }}
                            className="p-2 text-neutral-400 hover:text-lime-500 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-neutral-500 mt-2">{payment.notes}</p>
                    )}
                  </div>
                );
              })}
              {payments.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  Nenhum pagamento cadastrado. Clique em "Novo Pagamento" para adicionar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* NOTAS */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Notas e Anotações</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNoteForm({});
                }}
                className="w-full sm:w-auto px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Nova Nota
              </button>
            </div>

            {/* Form */}
            {(editingItem || Object.keys(noteForm).length > 0) && (
              <div className="mb-6 p-4 md:p-6 bg-neutral-900 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  placeholder="Título da nota"
                  value={noteForm.title || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full mb-3 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 text-lg font-semibold"
                />
                <textarea
                  placeholder="Escreva sua nota aqui... (suporta markdown)"
                  value={noteForm.content || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full mb-3 px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 min-h-[200px] resize-y"
                  rows={8}
                />
                <input
                  type="text"
                  placeholder="Categoria (ex: Bug, Feature, Documentação)"
                  value={noteForm.category || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSaveNote}
                    className="flex-1 px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setNoteForm({});
                      setEditingItem(null);
                    }}
                    className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg font-bold hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{note.title}</h3>
                      {note.category && (
                        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                          {note.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(note.id);
                          setNoteForm(note);
                        }}
                        className="p-2 text-neutral-400 hover:text-lime-500 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-neutral-300 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  Nenhuma nota cadastrada. Clique em "Nova Nota" para adicionar.
                </div>
              )}
            </div>
          </div>
        )}

        {/* INFORMAÇÕES */}
        {activeTab === 'info' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">Informações do Projeto</h2>
              <button
                onClick={() => {
                  setIsEditingDetail(!isEditingDetail);
                  if (!isEditingDetail && detail) {
                    setDetailForm(detail);
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
              >
                {isEditingDetail ? <X size={18} /> : <Edit2 size={18} />}
                {isEditingDetail ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div className="p-4 md:p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              {isEditingDetail ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2">Descrição</label>
                    <textarea
                      value={detailForm.description || ''}
                      onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                      rows={3}
                      placeholder="Descrição do projeto..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2">Cliente</label>
                      <input
                        type="text"
                        value={detailForm.clientName || ''}
                        onChange={(e) => setDetailForm({ ...detailForm, clientName: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2">Contato</label>
                      <input
                        type="text"
                        value={detailForm.clientContact || ''}
                        onChange={(e) => setDetailForm({ ...detailForm, clientContact: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                        placeholder="Email ou telefone"
                      />
                    </div>
                  </div>
                  
                  {/* URLs Section */}
                  <div className="space-y-4 pt-4 border-t border-neutral-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <LinkIcon size={18} />
                      URLs do Projeto
                    </h3>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
                        <Code size={14} />
                        Repositório (GitHub/GitLab)
                      </label>
                      <input
                        type="url"
                        value={detailForm.repositoryUrl || ''}
                        onChange={(e) => setDetailForm({ ...detailForm, repositoryUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                        placeholder="https://github.com/usuario/projeto"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
                          <Globe size={14} />
                          URL Produção
                        </label>
                        <input
                          type="url"
                          value={detailForm.productionUrl || ''}
                          onChange={(e) => setDetailForm({ ...detailForm, productionUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                          placeholder="https://app.exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
                          <Globe size={14} />
                          URL Staging
                        </label>
                        <input
                          type="url"
                          value={detailForm.stagingUrl || ''}
                          onChange={(e) => setDetailForm({ ...detailForm, stagingUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                          placeholder="https://staging.exemplo.com"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <button
                      onClick={handleSaveDetail}
                      className="flex-1 px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsEditingDetail(false)}
                      className="px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg font-bold hover:bg-neutral-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {detail?.description && (
                    <div>
                      <h3 className="text-sm font-bold text-neutral-400 mb-2">Descrição</h3>
                      <p className="text-neutral-300">{detail.description}</p>
                    </div>
                  )}
                  {(detail?.clientName || detail?.clientContact) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {detail?.clientName && (
                        <div>
                          <h3 className="text-sm font-bold text-neutral-400 mb-1">Cliente</h3>
                          <p className="text-white">{detail.clientName}</p>
                        </div>
                      )}
                      {detail?.clientContact && (
                        <div>
                          <h3 className="text-sm font-bold text-neutral-400 mb-1">Contato</h3>
                          <p className="text-white break-all">{detail.clientContact}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* URLs Display */}
                  {(detail?.repositoryUrl || detail?.productionUrl || detail?.stagingUrl) && (
                    <div className="space-y-4 pt-4 border-t border-neutral-800">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <LinkIcon size={18} />
                        URLs do Projeto
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {detail?.repositoryUrl && (
                          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                            <div className="flex items-center gap-2 mb-2">
                              <Code size={16} className="text-lime-500" />
                              <span className="text-sm font-bold text-neutral-400">Repositório</span>
                            </div>
                            <a 
                              href={detail.repositoryUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-lime-500 hover:text-lime-400 hover:underline break-all block"
                            >
                              {detail.repositoryUrl}
                            </a>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {detail?.productionUrl && (
                            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe size={16} className="text-green-500" />
                                <span className="text-sm font-bold text-neutral-400">Produção</span>
                              </div>
                              <a 
                                href={detail.productionUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-green-500 hover:text-green-400 hover:underline break-all block"
                              >
                                {detail.productionUrl}
                              </a>
                            </div>
                          )}
                          {detail?.stagingUrl && (
                            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe size={16} className="text-yellow-500" />
                                <span className="text-sm font-bold text-neutral-400">Staging</span>
                              </div>
                              <a 
                                href={detail.stagingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-yellow-500 hover:text-yellow-400 hover:underline break-all block"
                              >
                                {detail.stagingUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {!detail && (
                    <div className="text-center py-12 text-neutral-500">
                      Nenhuma informação cadastrada. Clique em "Editar" para adicionar.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
