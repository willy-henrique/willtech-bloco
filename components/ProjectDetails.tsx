
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Lock, DollarSign, FileText, 
  Calendar, AlertCircle, CheckCircle, XCircle, Copy, Eye, EyeOff,
  Globe, Code, User, Mail, Key, Link as LinkIcon, Save, X
} from 'lucide-react';
import { Project, ProjectCredential, ProjectPayment, ProjectNote, ProjectDetail } from '../types';
import { 
  projectCredentialsService, 
  projectPaymentsService, 
  projectNotesService,
  projectDetailsService 
} from '../src/services/firestoreService';

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
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Form states
  const [credentialForm, setCredentialForm] = useState<Partial<ProjectCredential>>({});
  const [paymentForm, setPaymentForm] = useState<Partial<ProjectPayment>>({});
  const [noteForm, setNoteForm] = useState<Partial<ProjectNote>>({});
  const [detailForm, setDetailForm] = useState<Partial<ProjectDetail>>({});

  useEffect(() => {
    loadData();
  }, [project.id]);

  // Fechar formulários ao trocar de aba
  useEffect(() => {
    setShowCredentialForm(false);
    setShowNoteForm(false);
    setShowPaymentForm(false);
    setEditingItem(null);
  }, [activeTab]);

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
      if (!credentialForm.title || !credentialForm.title.trim()) {
        alert('Por favor, preencha o título da credencial.');
        return;
      }
      
      // Remover campos undefined/null/vazios antes de salvar (exceto title que é obrigatório)
      const cleanCredential: Partial<ProjectCredential> = {
        projectId: project.id,
        title: credentialForm.title.trim()
      };
      
      // Adicionar apenas campos que têm valor
      if (credentialForm.username && credentialForm.username.trim()) {
        cleanCredential.username = credentialForm.username.trim();
      }
      if (credentialForm.email && credentialForm.email.trim()) {
        cleanCredential.email = credentialForm.email.trim();
      }
      if (credentialForm.password && credentialForm.password.trim()) {
        cleanCredential.password = credentialForm.password.trim();
      }
      if (credentialForm.url && credentialForm.url.trim()) {
        cleanCredential.url = credentialForm.url.trim();
      }
      if (credentialForm.env && credentialForm.env.trim()) {
        cleanCredential.env = credentialForm.env.trim();
      }
      if (credentialForm.notes && credentialForm.notes.trim()) {
        cleanCredential.notes = credentialForm.notes.trim();
      }
      
      if (editingItem) {
        await projectCredentialsService.update(editingItem, cleanCredential);
      } else {
        await projectCredentialsService.create(cleanCredential as Omit<ProjectCredential, 'id' | 'createdAt'>);
      }
      setCredentialForm({});
      setEditingItem(null);
      setShowCredentialForm(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar credencial:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao salvar credencial:\n\n${errorMessage}\n\nCertifique-se de que o título está preenchido.`);
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
      if (!paymentForm.title || !paymentForm.title.trim()) {
        alert('Por favor, preencha o título do pagamento.');
        return;
      }
      
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
        title: paymentForm.title.trim(),
        dueDate,
        amount: paymentForm.amount,
        currency: paymentForm.currency || 'BRL',
        status: paymentForm.status || 'pending',
        isRecurring: paymentForm.isRecurring || false,
        recurringDay: paymentForm.recurringDay,
        createdAt: Date.now()
      };
      const status = getPaymentStatus(tempPayment);
      
      // Remover campos undefined/null/vazios antes de salvar
      const cleanPayment: Partial<ProjectPayment> = {
        projectId: project.id,
        title: paymentForm.title.trim(),
        dueDate,
        currency: paymentForm.currency || 'BRL',
        status,
        isRecurring: paymentForm.isRecurring || false
      };
      
      // Adicionar apenas campos que têm valor
      if (paymentForm.amount !== undefined && paymentForm.amount !== null) {
        cleanPayment.amount = paymentForm.amount;
      }
      if (paymentForm.recurringDay !== undefined && paymentForm.recurringDay !== null) {
        cleanPayment.recurringDay = paymentForm.recurringDay;
      }
      if (paymentForm.notes && paymentForm.notes.trim()) {
        cleanPayment.notes = paymentForm.notes.trim();
      }
      
      if (editingItem) {
        await projectPaymentsService.update(editingItem, cleanPayment);
      } else {
        await projectPaymentsService.create(cleanPayment as Omit<ProjectPayment, 'id' | 'createdAt'>);
      }
      setPaymentForm({});
      setEditingItem(null);
      setShowPaymentForm(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar pagamento:', error);
      alert(`Erro ao salvar pagamento: ${error?.message || 'Erro desconhecido'}`);
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
      if (!noteForm.title || !noteForm.title.trim() || !noteForm.content || !noteForm.content.trim()) {
        alert('Por favor, preencha o título e o conteúdo da nota.');
        return;
      }
      
      // Remover campos undefined/null/vazios antes de salvar (exceto title e content que são obrigatórios)
      const cleanNote: Partial<ProjectNote> = {
        projectId: project.id,
        title: noteForm.title.trim(),
        content: noteForm.content.trim()
      };
      
      // Adicionar categoria apenas se tiver valor
      if (noteForm.category && noteForm.category.trim()) {
        cleanNote.category = noteForm.category.trim();
      }
      
      if (editingItem) {
        await projectNotesService.update(editingItem, cleanNote);
      } else {
        await projectNotesService.create(cleanNote as Omit<ProjectNote, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setNoteForm({});
      setEditingItem(null);
      setShowNoteForm(false);
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar nota:', error);
      alert(`Erro ao salvar nota: ${error?.message || 'Erro desconhecido'}`);
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
                  setShowCredentialForm(true);
                }}
                className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Nova Credencial
              </button>
            </div>

            {/* Form */}
            {(showCredentialForm || editingItem) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-5 md:p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl border-2 border-neutral-800 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="text-lime-500" size={20} />
                  <h3 className="text-lg font-bold text-white">
                    {editingItem ? 'Editar Credencial' : 'Nova Credencial'}
                  </h3>
                </div>
                
                <input
                  type="text"
                  placeholder="Título (ex: Admin, Dev, Staging) *"
                  value={credentialForm.title || ''}
                  onChange={(e) => setCredentialForm({ ...credentialForm, title: e.target.value })}
                  className="w-full mb-3 px-4 py-3 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all font-semibold"
                  required
                />
                <p className="text-xs text-neutral-500 mb-3 -mt-2">
                  * Campo obrigatório. Os demais campos são opcionais.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                      <User size={12} />
                      Usuário
                    </label>
                    <input
                      type="text"
                      placeholder="Nome de usuário"
                      value={credentialForm.username || ''}
                      onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                      <Mail size={12} />
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={credentialForm.email || ''}
                      onChange={(e) => setCredentialForm({ ...credentialForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="mb-3 relative">
                  <label className="text-xs font-bold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Key size={12} />
                    Senha
                  </label>
                  <input
                    type={showPassword[editingItem || 'new'] ? 'text' : 'password'}
                    placeholder="Senha ou token"
                    value={credentialForm.password || ''}
                    onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword({ ...showPassword, [editingItem || 'new']: !showPassword[editingItem || 'new'] })}
                    className="absolute right-3 top-8 text-neutral-400 hover:text-lime-500 transition-colors"
                    title={showPassword[editingItem || 'new'] ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword[editingItem || 'new'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-bold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon size={12} />
                    URL (opcional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com"
                    value={credentialForm.url || ''}
                    onChange={(e) => setCredentialForm({ ...credentialForm, url: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                  />
                </div>
                <div className="mb-3">
                  <label className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-lime-500" />
                    Arquivo .env (opcional)
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Cole aqui o conteúdo do arquivo .env do projeto...&#10;&#10;Exemplo:&#10;DATABASE_URL=postgresql://...&#10;API_KEY=abc123&#10;SECRET_KEY=xyz789"
                      value={credentialForm.env || ''}
                      onChange={(e) => setCredentialForm({ ...credentialForm, env: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 font-mono text-xs leading-relaxed transition-all"
                      rows={10}
                    />
                    {credentialForm.env && (
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(credentialForm.env!)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-lime-500 rounded text-xs font-bold transition-all flex items-center gap-1"
                          title="Copiar .env"
                        >
                          <Copy size={12} />
                          Copiar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-lime-500 mt-1.5"></div>
                    <p className="text-xs text-neutral-500 flex-1">
                      Cole todo o conteúdo do arquivo .env aqui. As variáveis serão armazenadas de forma segura.
                    </p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5">
                    Notas adicionais (opcional)
                  </label>
                  <textarea
                    placeholder="Informações adicionais sobre esta credencial..."
                    value={credentialForm.notes || ''}
                    onChange={(e) => setCredentialForm({ ...credentialForm, notes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                    rows={2}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-neutral-800">
                  <button
                    onClick={handleSaveCredential}
                    disabled={!credentialForm.title}
                    className="flex-1 px-5 py-3 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-all hover:scale-105 shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Save size={18} />
                    Salvar Credencial
                  </button>
                  <button
                    onClick={() => {
                      setCredentialForm({});
                      setEditingItem(null);
                      setShowCredentialForm(false);
                    }}
                    className="px-5 py-3 bg-neutral-800 text-neutral-400 rounded-xl font-bold hover:bg-neutral-700 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
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
                        <div className="mt-4 p-4 bg-gradient-to-br from-neutral-950 to-black rounded-xl border-2 border-neutral-800 hover:border-lime-500/50 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-lime-500" />
                              <span className="text-sm font-bold text-white">Arquivo .env</span>
                              <span className="px-2 py-0.5 bg-lime-500/10 text-lime-400 text-xs font-bold rounded border border-lime-500/20">
                                {cred.env.split('\n').filter(line => line.trim()).length} variáveis
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                copyToClipboard(cred.env!);
                                // Feedback visual temporário
                                const btn = event?.currentTarget;
                                if (btn) {
                                  const originalText = btn.innerHTML;
                                  btn.innerHTML = '<span class="text-green-400">✓ Copiado!</span>';
                                  setTimeout(() => {
                                    btn.innerHTML = originalText;
                                  }, 2000);
                                }
                              }}
                              className="px-3 py-1.5 bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 hover:text-lime-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-lime-500/20"
                            >
                              <Copy size={14} />
                              Copiar Tudo
                            </button>
                          </div>
                          <div className="relative">
                            <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto p-3 bg-black/50 rounded-lg border border-neutral-800 custom-scrollbar">
                              {cred.env}
                            </pre>
                            <div className="absolute bottom-2 right-2 flex gap-1">
                              <button
                                onClick={() => {
                                  const lines = cred.env!.split('\n');
                                  const vars = lines.filter(line => line.trim() && !line.trim().startsWith('#'));
                                  copyToClipboard(vars.join('\n'));
                                }}
                                className="px-2 py-1 bg-neutral-800/90 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded text-xs transition-all"
                                title="Copiar apenas variáveis (sem comentários)"
                              >
                                Variáveis
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(cred.id);
                          setCredentialForm(cred);
                          setShowCredentialForm(true);
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
                  setShowPaymentForm(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Novo Pagamento
              </button>
            </div>

            {/* Form */}
            {(showPaymentForm || editingItem) && (
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
                      setShowPaymentForm(false);
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
                              setShowPaymentForm(true);
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Notas e Anotações</h2>
                <p className="text-sm text-neutral-400">Organize suas ideias, bugs, features e documentações</p>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNoteForm({});
                  setShowNoteForm(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-all hover:scale-105 shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Nova Nota
              </button>
            </div>

            {/* Form */}
            {(showNoteForm || editingItem) && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-5 md:p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl border-2 border-neutral-800 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-lime-500" size={20} />
                  <h3 className="text-lg font-bold text-white">
                    {editingItem ? 'Editar Nota' : 'Nova Nota'}
                  </h3>
                </div>
                
                <input
                  type="text"
                  placeholder="Título da nota"
                  value={noteForm.title || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full mb-4 px-4 py-3 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 text-lg font-semibold transition-all"
                />
                
                <textarea
                  placeholder="Escreva sua nota aqui... (suporta markdown e quebras de linha)"
                  value={noteForm.content || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full mb-4 px-4 py-3 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 min-h-[250px] resize-y font-mono text-sm transition-all"
                  rows={10}
                />
                
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Categoria (ex: Bug, Feature, Documentação, Ideia)"
                    value={noteForm.category || ''}
                    onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                    className="flex-1 px-4 py-2 bg-neutral-950 border-2 border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-500/20 transition-all"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-neutral-800">
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteForm.title || !noteForm.content}
                    className="flex-1 px-5 py-3 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-all hover:scale-105 shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Save size={18} />
                    Salvar Nota
                  </button>
                  <button
                    onClick={() => {
                      setNoteForm({});
                      setEditingItem(null);
                    }}
                    className="px-5 py-3 bg-neutral-800 text-neutral-400 rounded-xl font-bold hover:bg-neutral-700 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}

            {/* List */}
            {notes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map(note => (
                  <motion.div 
                    key={note.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group p-5 bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl border-2 border-neutral-800 hover:border-lime-500/50 transition-all shadow-lg hover:shadow-xl hover:shadow-lime-500/10"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-lime-400 transition-colors">
                          {note.title}
                        </h3>
                        {note.category && (
                          <span className="inline-block text-xs font-bold text-lime-400 bg-lime-500/10 px-3 py-1 rounded-full border border-lime-500/20">
                            {note.category}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingItem(note.id);
                            setNoteForm(note);
                            setShowNoteForm(true);
                          }}
                          className="p-2 text-neutral-400 hover:text-lime-500 hover:bg-lime-500/10 rounded-lg transition-all"
                          title="Editar nota"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Deletar nota"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-neutral-950/50 rounded-xl p-4 mb-3 border border-neutral-800">
                      <p className="text-neutral-300 whitespace-pre-wrap text-sm leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        Criada em {new Date(note.createdAt).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {note.updatedAt && note.updatedAt !== note.createdAt && (
                        <span className="text-lime-500/70">
                          Editada
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-neutral-900/50 rounded-2xl border-2 border-dashed border-neutral-800"
              >
                <FileText className="mx-auto mb-4 text-neutral-600" size={48} />
                <h3 className="text-lg font-bold text-neutral-400 mb-2">Nenhuma nota cadastrada</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Comece organizando suas ideias, bugs e documentações
                </p>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setNoteForm({});
                    setShowNoteForm(true);
                  }}
                  className="px-5 py-2.5 bg-lime-500 text-black rounded-xl font-bold hover:bg-lime-400 transition-all hover:scale-105 shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2 mx-auto"
                >
                  <Plus size={18} />
                  Criar Primeira Nota
                </button>
              </motion.div>
            )}
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
                      <label className="text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
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
                        <label className="text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
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
                        <label className="text-sm font-bold text-neutral-400 mb-2 flex items-center gap-2">
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
