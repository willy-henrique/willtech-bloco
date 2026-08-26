import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskPriority } from '../../../types';

const addTask = vi.fn();
const toggleTask = vi.fn();
const deleteTask = vi.fn();
vi.mock('../../../AppContext', () => ({
  useApp: () => ({
    tasks: [{ id: 't1', projectId: 'p1', description: 'Corrigir producao', priority: TaskPriority.CRITICAL, isCompleted: false, createdAt: 1 }],
    projects: [{ id: 'p1', name: 'Portal', type: 'SaaS', status: 'Active', progress: 50, color: '#fff' }],
    addTask, toggleTask, deleteTask,
  }),
}));

import EisenhowerMatrix from '../../../components/EisenhowerMatrix';

beforeEach(() => {
  addTask.mockReset().mockResolvedValue(undefined);
  toggleTask.mockReset().mockResolvedValue(undefined);
  deleteTask.mockReset().mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('EisenhowerMatrix', () => {
  it('adiciona uma tarefa no quadrante escolhido', async () => {
    const user = userEvent.setup();
    render(<EisenhowerMatrix />);
    await user.click(screen.getAllByRole('button', { name: /adicionar tarefa/i })[0]);
    await user.type(screen.getByPlaceholderText('Descreva a próxima ação...'), 'Subir hotfix');
    await user.click(screen.getAllByRole('button', { name: 'Adicionar tarefa' })[0]);
    expect(addTask).toHaveBeenCalledWith('Geral', 'Subir hotfix', TaskPriority.CRITICAL);
  });

  it('conclui e exclui uma tarefa', async () => {
    const user = userEvent.setup();
    render(<EisenhowerMatrix />);
    await user.click(screen.getByTitle('Marcar como concluída'));
    await user.click(screen.getByTitle('Excluir tarefa'));
    expect(toggleTask).toHaveBeenCalledWith('t1');
    expect(deleteTask).toHaveBeenCalledWith('t1');
  });

  it('mostra falha de persistencia sem descartar o texto', async () => {
    addTask.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<EisenhowerMatrix />);
    await user.click(screen.getAllByRole('button', { name: /adicionar tarefa/i })[0]);
    await user.type(screen.getByPlaceholderText('Descreva a próxima ação...'), 'Nao perder');
    await user.click(screen.getAllByRole('button', { name: 'Adicionar tarefa' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(/nao foi adicionada/i);
    expect(screen.getByDisplayValue('Nao perder')).toBeInTheDocument();
  });
});
