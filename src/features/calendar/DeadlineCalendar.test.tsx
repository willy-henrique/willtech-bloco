import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addDeadline, updateDeadline, deleteDeadline, getByProjectId } = vi.hoisted(() => ({
  addDeadline: vi.fn(), updateDeadline: vi.fn(), deleteDeadline: vi.fn(), getByProjectId: vi.fn(),
}));

vi.mock('../../../AppContext', () => ({
  useApp: () => ({
    deadlines: [{ id: 'd1', title: 'Sprint atual', date: '2026-09-10', projectId: 'p1', type: 'Sprint' }],
    projects: [{ id: 'p1', name: 'Portal', type: 'SaaS', status: 'Active', progress: 50, color: '#fff' }],
    addDeadline, updateDeadline, deleteDeadline,
  }),
}));
vi.mock('../../services/firestoreService', () => ({
  projectPaymentsService: { getByProjectId },
}));

import DeadlineCalendar from '../../../components/DeadlineCalendar';

beforeEach(() => {
  addDeadline.mockReset().mockResolvedValue(undefined);
  updateDeadline.mockReset().mockResolvedValue(undefined);
  deleteDeadline.mockReset().mockResolvedValue(undefined);
  getByProjectId.mockReset().mockResolvedValue([]);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('DeadlineCalendar', () => {
  it('cria um marco contratual', async () => {
    const user = userEvent.setup();
    render(<DeadlineCalendar />);
    await user.click(screen.getByRole('button', { name: /novo marco/i }));
    await user.type(screen.getByLabelText('Titulo do marco'), 'Entrega MVP');
    await user.type(screen.getByLabelText('Data do marco'), '2026-09-20');
    await user.selectOptions(screen.getByLabelText('Tipo do marco'), 'Contract');
    await user.click(screen.getByRole('button', { name: /salvar marco/i }));
    expect(addDeadline).toHaveBeenCalledWith({ title: 'Entrega MVP', date: '2026-09-20', projectId: 'p1', type: 'Contract' });
  });

  it('edita e exclui um marco', async () => {
    const user = userEvent.setup();
    render(<DeadlineCalendar />);
    await user.click(screen.getByRole('button', { name: 'Editar Sprint atual' }));
    await user.clear(screen.getByLabelText('Titulo do marco'));
    await user.type(screen.getByLabelText('Titulo do marco'), 'Sprint final');
    await user.click(screen.getByRole('button', { name: /salvar marco/i }));
    expect(updateDeadline).toHaveBeenCalledWith('d1', expect.objectContaining({ title: 'Sprint final' }));
    await user.click(screen.getByRole('button', { name: 'Excluir Sprint atual' }));
    expect(deleteDeadline).toHaveBeenCalledWith('d1');
  });

  it('carrega pagamentos dos projetos ao abrir a aba', async () => {
    getByProjectId.mockResolvedValue([{ id: 'pay1', projectId: 'p1', title: 'Mensalidade', dueDate: '2026-09-01', amount: 900, status: 'pending', createdAt: 1 }]);
    render(<DeadlineCalendar />);
    await userEvent.setup().click(screen.getByRole('button', { name: /pagamentos/i }));
    expect(await screen.findByText('Mensalidade')).toBeInTheDocument();
    await waitFor(() => expect(getByProjectId).toHaveBeenCalledWith('p1'));
  });
});
