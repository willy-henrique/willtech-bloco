
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
  const getPaymentStatus = (dueDate: string, status: string): 'pending' | 'paid' | 'overdue' => {
    if (status === 'paid') return 'paid';
    const today = new Date();
    const due = new Date(dueDate);
    if (due < today) return 'overdue';
    return 'pending';
  };

  const updatePaymentStatuses = () => {
    setPayments(prev => prev.map(p => ({
      ...p,
      status: getPaymentStatus(p.dueDate, p.status)
    })));
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
      const dueDate = paymentForm.dueDate || new Date().toISOString().split('T')[0];
      const status = getPaymentStatus(dueDate, paymentForm.status || 'pending');
      
      if (editingItem) {
        await projectPaymentsService.update(editingItem, { ...paymentForm, status });
      } else {
        await projectPaymentsService.create({
          projectId: project.id,
          title: paymentForm.title || '',
          dueDate,
          amount: paymentForm.amount,
          currency: paymentForm.currency || 'BRL',
          status,
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
      <div className="flex gap-2 mb-6 border-b border-neutral-800">
        {[
          { id: 'credentials', label: 'Credenciais', icon: Lock },
          { id: 'payments', label: 'Pagamentos', icon: DollarSign },
          { id: 'notes', label: 'Notas', icon: FileText },
          { id: 'info', label: 'Informações', icon: Globe }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-lime-500 text-lime-500'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Icon size={16} />
              {tab.label}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Pagamentos e Contratos</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setPaymentForm({ dueDate: new Date().toISOString().split('T')[0], status: 'pending' });
                }}
                className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Novo Pagamento
              </button>
            </div>

            {/* Form */}
            {(editingItem || Object.keys(paymentForm).length > 0) && (
              <div className="mb-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  placeholder="Título (ex: Mensalidade Janeiro, Contrato Anual)"
                  value={paymentForm.title || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <input
                    type="date"
                    value={paymentForm.dueDate || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                    className="px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-lime-500"
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
                <textarea
                  placeholder="Notas (opcional)"
                  value={paymentForm.notes || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePayment}
                    className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
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
                const status = getPaymentStatus(payment.dueDate, payment.status);
                const overdue = isDateOverdue(payment.dueDate);
                const days = daysUntilDue(payment.dueDate);
                
                return (
                  <div
                    key={payment.id}
                    className={`p-4 rounded-xl border-2 ${
                      status === 'overdue'
                        ? 'bg-red-500/10 border-red-500/50'
                        : status === 'paid'
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-neutral-900 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{payment.title}</h3>
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
                        </div>
                      </div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Notas e Anotações</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNoteForm({});
                }}
                className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Nova Nota
              </button>
            </div>

            {/* Form */}
            {(editingItem || Object.keys(noteForm).length > 0) && (
              <div className="mb-6 p-4 bg-neutral-900 rounded-xl border border-neutral-800">
                <input
                  type="text"
                  placeholder="Título da nota"
                  value={noteForm.title || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <textarea
                  placeholder="Conteúdo da nota..."
                  value={noteForm.content || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                  rows={6}
                />
                <input
                  type="text"
                  placeholder="Categoria (opcional)"
                  value={noteForm.category || ''}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                  className="w-full mb-3 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNote}
                    className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Informações do Projeto</h2>
              <button
                onClick={() => {
                  setIsEditingDetail(!isEditingDetail);
                  if (!isEditingDetail && detail) {
                    setDetailForm(detail);
                  }
                }}
                className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
              >
                {isEditingDetail ? <X size={18} /> : <Edit2 size={18} />}
                {isEditingDetail ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div className="p-6 bg-neutral-900 rounded-xl border border-neutral-800">
              {isEditingDetail ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2">Descrição</label>
                    <textarea
                      value={detailForm.description || ''}
                      onChange={(e) => setDetailForm({ ...detailForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                      rows={4}
                      placeholder="Descrição do projeto..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="block text-sm font-bold text-neutral-400 mb-2">Contato do Cliente</label>
                      <input
                        type="text"
                        value={detailForm.clientContact || ''}
                        onChange={(e) => setDetailForm({ ...detailForm, clientContact: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                        placeholder="Email ou telefone"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-neutral-400 mb-2">Repositório</label>
                    <input
                      type="url"
                      value={detailForm.repositoryUrl || ''}
                      onChange={(e) => setDetailForm({ ...detailForm, repositoryUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2">URL Produção</label>
                      <input
                        type="url"
                        value={detailForm.productionUrl || ''}
                        onChange={(e) => setDetailForm({ ...detailForm, productionUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-neutral-400 mb-2">URL Staging</label>
                      <input
                        type="url"
                        value={detailForm.stagingUrl || ''}
                        onChange={(e) => setDetailForm({ ...detailForm, stagingUrl: e.target.value })}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-lime-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveDetail}
                    className="px-4 py-2 bg-lime-500 text-black rounded-lg font-bold hover:bg-lime-400 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {detail?.description && (
                    <div>
                      <h3 className="text-sm font-bold text-neutral-400 mb-2">Descrição</h3>
                      <p className="text-neutral-300">{detail.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detail?.clientName && (
                      <div>
                        <h3 className="text-sm font-bold text-neutral-400 mb-1">Cliente</h3>
                        <p className="text-white">{detail.clientName}</p>
                      </div>
                    )}
                    {detail?.clientContact && (
                      <div>
                        <h3 className="text-sm font-bold text-neutral-400 mb-1">Contato</h3>
                        <p className="text-white">{detail.clientContact}</p>
                      </div>
                    )}
                  </div>
                  {detail?.repositoryUrl && (
                    <div>
                      <h3 className="text-sm font-bold text-neutral-400 mb-1 flex items-center gap-2">
                        <Code size={14} />
                        Repositório
                      </h3>
                      <a href={detail.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:underline">
                        {detail.repositoryUrl}
                      </a>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detail?.productionUrl && (
                      <div>
                        <h3 className="text-sm font-bold text-neutral-400 mb-1 flex items-center gap-2">
                          <Globe size={14} />
                          Produção
                        </h3>
                        <a href={detail.productionUrl} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:underline">
                          {detail.productionUrl}
                        </a>
                      </div>
                    )}
                    {detail?.stagingUrl && (
                      <div>
                        <h3 className="text-sm font-bold text-neutral-400 mb-1 flex items-center gap-2">
                          <Globe size={14} />
                          Staging
                        </h3>
                        <a href={detail.stagingUrl} target="_blank" rel="noopener noreferrer" className="text-lime-500 hover:underline">
                          {detail.stagingUrl}
                        </a>
                      </div>
                    )}
                  </div>
                  {!detail && (
                    <div className="text-center py-8 text-neutral-500">
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
