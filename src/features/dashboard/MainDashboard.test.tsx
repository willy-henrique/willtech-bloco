import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskPriority } from '../../../types';

const actions = vi.hoisted(() => ({
  addProject: vi.fn(), updateProject: vi.fn(), deleteProject: vi.fn(), toggleTask: vi.fn(),
  clearDataError: vi.fn(), logout: vi.fn(),
}));
const githubSync = vi.hoisted(() => vi.fn());
let appState: any;

vi.mock('../../../AppContext', () => ({ useApp: () => appState }));
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ user: { displayName: 'Willy', email: 'willy@test.dev' }, logout: actions.logout }) }));
vi.mock('../../services/firestoreService', () => ({ projectPaymentsService: { getAll: vi.fn().mockResolvedValue([]) }, projectNotesService: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../components/ProjectCard', () => ({ default: ({ project, onOpen, onEdit }: any) => <div><span>{project.name}</span><button onClick={onOpen}>Abrir {project.name}</button><button onClick={onEdit}>Editar {project.name}</button></div> }));
vi.mock('../../../components/ProjectDetails', () => ({ default: ({ project, onBack, onConfigure, onRefreshUpdates }: any) => <div>DETALHES {project.name}<button onClick={onBack}>Voltar</button><button onClick={onConfigure}>Configurar projeto</button><button onClick={onRefreshUpdates}>Atualizar projeto</button></div> }));
vi.mock('../../../components/ProjectModal', () => ({
  default: ({ isOpen, onSave, onUpdate, project }: any) => isOpen ? (
    <div role="dialog">
      MODAL PROJETO {project?.name}
      <button onClick={() => project ? onUpdate(project.id, { name: 'Portal configurado' }) : onSave({ name: 'Novo' })}>Confirmar projeto</button>
    </div>
  ) : null,
}));
vi.mock('../../../components/EisenhowerMatrix', () => ({ default: () => <div>MATRIZ TESTE</div> }));
vi.mock('../../../components/FinanceHub', () => ({ default: () => <div>FINANCE TESTE</div> }));
vi.mock('../../../components/Vault', () => ({ default: () => <div>VAULT TESTE</div> }));
vi.mock('../../../components/SnippetManager', () => ({ default: () => <div>SNIPPETS TESTE</div> }));
vi.mock('../../../components/DeadlineCalendar', () => ({ default: () => <div>AGENDA TESTE</div> }));
vi.mock('../../features/capture/CaptureChat', () => ({ default: ({ open }: any) => open ? <div>CAPTURE ABERTO</div> : null }));
vi.mock('../../features/projects/ImportarProjetos', () => ({ default: ({ open }: any) => open ? <div>IMPORT ABERTO</div> : null }));
vi.mock('../../features/projects/AtualizarDoGitHub', () => ({
  default: () => <div>GITHUB TESTE</div>,
  buscarAtividadeNoGitHub: githubSync,
}));
vi.mock('../../features/projects/ordenarPorAtividade', () => ({ ordenarPorAtividade: (projects: any[]) => projects }));

import MainDashboard from '../../../MainDashboard';

beforeEach(() => {
  Object.values(actions).forEach((action) => action.mockReset().mockResolvedValue(undefined));
  githubSync.mockReset().mockResolvedValue([]);
  appState = {
    projects: [{ id: 'p1', name: 'Portal Alpha', type: 'SaaS', stack: 'React', status: 'Active', progress: 60, color: '#fff' }],
    tasks: [{ id: 't1', projectId: 'p1', description: 'Incidente', priority: TaskPriority.CRITICAL, isCompleted: false, createdAt: 1 }],
    isLoading: false, dataError: null,
    ...actions,
  };
});

describe('MainDashboard', () => {
  it('navega por todas as areas principais', async () => {
    const user = userEvent.setup();
    render(<MainDashboard />);
    await user.click(screen.getAllByRole('button', { name: 'Prioridades' })[0]);
    expect(screen.getByText('MATRIZ TESTE')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Finanças' })[0]);
    expect(screen.getByText('FINANCE TESTE')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cofre' }));
    expect(screen.getByText('VAULT TESTE')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /base/i }));
    expect(screen.getByText('SNIPPETS TESTE')).toBeInTheDocument();
    expect(screen.getByText('AGENDA TESTE')).toBeInTheDocument();
  });

  it('abre projeto, volta e aciona criacao', async () => {
    const user = userEvent.setup();
    render(<MainDashboard />);
    await user.click(screen.getByRole('button', { name: 'Abrir Portal Alpha' }));
    expect(screen.getByText(/DETALHES Portal Alpha/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    await user.click(screen.getByRole('button', { name: /novo projeto/i }));
    await user.click(screen.getByRole('button', { name: 'Confirmar projeto' }));
    expect(actions.addProject).toHaveBeenCalledWith({ name: 'Novo' });
  });

  it('configura o projeto a partir da tela de detalhes', async () => {
    const user = userEvent.setup();
    render(<MainDashboard />);
    await user.click(screen.getByRole('button', { name: 'Abrir Portal Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Configurar projeto' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Portal Alpha');
    await user.click(screen.getByRole('button', { name: 'Confirmar projeto' }));
    expect(actions.updateProject).toHaveBeenCalledWith('p1', { name: 'Portal configurado' });
  });

  it('busca e salva as atualizacoes do projeto aberto', async () => {
    githubSync.mockResolvedValue([{
      repo: 'willtech/portal',
      ok: true,
      ultimoCommit: '2026-08-26',
      evolucoes30d: 3,
      correcoes30d: 1,
      historico: [{ data: '2026-08-26', tipo: 'evoluiu', assunto: 'novo painel' }],
    }]);
    appState.projects[0].repo = 'willtech/portal';
    const user = userEvent.setup();
    render(<MainDashboard />);
    await user.click(screen.getByRole('button', { name: 'Abrir Portal Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Atualizar projeto' }));
    expect(githubSync).toHaveBeenCalledWith(['willtech/portal']);
    expect(actions.updateProject).toHaveBeenCalledWith('p1', expect.objectContaining({
      ultimoCommit: '2026-08-26',
      evolucoes30d: 3,
      correcoes30d: 1,
    }));
  });

  it('abre captura e importacao', async () => {
    const user = userEvent.setup();
    render(<MainDashboard />);
    await user.click(screen.getAllByRole('button', { name: /captura rapida|capturar tarefa/i })[0]);
    expect(screen.getByText('CAPTURE ABERTO')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /importar projetos/i }));
    expect(screen.getByText('IMPORT ABERTO')).toBeInTheDocument();
  });

  it('mostra e fecha erro de sincronizacao', async () => {
    appState.dataError = 'Firestore indisponivel';
    const user = userEvent.setup();
    render(<MainDashboard />);
    expect(screen.getByRole('alert')).toHaveTextContent('Firestore indisponivel');
    await user.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(actions.clearDataError).toHaveBeenCalled();
  });
});
