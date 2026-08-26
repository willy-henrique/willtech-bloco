import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../types';

const mocks = vi.hoisted(() => {
  const collectionService = () => ({ getByProjectId: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() });
  return {
    projectCredentialsService: collectionService(),
    projectPaymentsService: collectionService(),
    projectNotesService: collectionService(),
    projectDetailsService: { getByProjectId: vi.fn(), createOrUpdate: vi.fn() },
  };
});

vi.mock('../../services/firestoreService', () => mocks);
vi.mock('./EvolucaoProjeto', () => ({ default: () => <div>EVOLUCAO TESTE</div> }));

import ProjectDetails from '../../../components/ProjectDetails';

const project: Project = { id: 'p1', name: 'Portal', type: 'SaaS', status: 'Active', progress: 70, color: '#22c55e' };

beforeEach(() => {
  [mocks.projectCredentialsService, mocks.projectPaymentsService, mocks.projectNotesService].forEach((service) => {
    service.getByProjectId.mockReset().mockResolvedValue([]);
    service.create.mockReset().mockResolvedValue('new-id');
    service.update.mockReset().mockResolvedValue(undefined);
    service.delete.mockReset().mockResolvedValue(undefined);
  });
  mocks.projectDetailsService.getByProjectId.mockReset().mockResolvedValue(null);
  mocks.projectDetailsService.createOrUpdate.mockReset().mockResolvedValue('p1');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

const renderDetails = async () => {
  render(<ProjectDetails project={project} onBack={vi.fn()} />);
  expect(await screen.findByText('EVOLUCAO TESTE')).toBeInTheDocument();
  return userEvent.setup();
};

describe('ProjectDetails', () => {
  it('salva uma credencial vinculada ao projeto', async () => {
    const user = await renderDetails();
    await user.click(screen.getByRole('button', { name: /credenciais/i }));
    await user.click(screen.getByRole('button', { name: /nova credencial/i }));
    await user.type(screen.getByPlaceholderText(/Título \(ex: Admin/i), 'Admin');
    await user.type(screen.getByPlaceholderText('Nome de usuário'), 'will');
    await user.click(screen.getByRole('button', { name: /salvar credencial/i }));
    await waitFor(() => expect(mocks.projectCredentialsService.create).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p1', title: 'Admin', username: 'will' })));
  });

  it('salva um pagamento e uma nota', async () => {
    const user = await renderDetails();
    await user.click(screen.getByRole('button', { name: /pagamentos/i }));
    await user.click(screen.getByRole('button', { name: /novo pagamento/i }));
    await user.type(screen.getByPlaceholderText(/Título \(ex: Mensalidade/i), 'Hospedagem');
    await user.type(screen.getByPlaceholderText('Valor'), '450');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(mocks.projectPaymentsService.create).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p1', title: 'Hospedagem', amount: 450 })));

    await user.click(screen.getByRole('button', { name: /notas/i }));
    await user.click(screen.getByRole('button', { name: /nova nota/i }));
    await user.type(screen.getByPlaceholderText('Título da nota'), 'Decisao');
    await user.type(screen.getByPlaceholderText(/Escreva sua nota/i), 'Usar Postgres');
    await user.click(screen.getByRole('button', { name: /salvar nota/i }));
    await waitFor(() => expect(mocks.projectNotesService.create).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p1', title: 'Decisao', content: 'Usar Postgres' })));
  });

  it('salva as informacoes do projeto', async () => {
    const user = await renderDetails();
    await user.click(screen.getByRole('button', { name: /informações/i }));
    await user.click(screen.getByRole('button', { name: /^editar$/i }));
    await user.type(screen.getByPlaceholderText('Descrição do projeto...'), 'Portal do cliente');
    await user.type(screen.getByPlaceholderText('Nome do cliente'), 'Acme');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(mocks.projectDetailsService.createOrUpdate).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'p1', description: 'Portal do cliente', clientName: 'Acme' })));
  });

  it('informa quais dados nao puderam ser carregados', async () => {
    mocks.projectCredentialsService.getByProjectId.mockRejectedValue(new Error('permission-denied'));
    render(<ProjectDetails project={project} onBack={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/credenciais/i);
    expect(screen.getByText('EVOLUCAO TESTE')).toBeInTheDocument();
  });
});
