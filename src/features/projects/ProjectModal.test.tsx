import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectModal from '../../../components/ProjectModal';
import type { Project } from '../../../types';

const project: Project = { id: 'p1', name: 'Portal', type: 'SaaS', status: 'Active', progress: 40, color: '#3fcf8e', stack: 'React/Node' };

beforeEach(() => vi.spyOn(window, 'confirm').mockReturnValue(true));

describe('ProjectModal', () => {
  it('cria um projeto e fecha somente depois de salvar', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} />);
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Novo Portal');
    await user.type(screen.getByLabelText('Tipo'), 'Dashboard');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Novo Portal', type: 'Dashboard' })));
    expect(onClose).toHaveBeenCalled();
  });

  it('mostra erro e nao fecha quando o banco falha', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('offline'));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<ProjectModal isOpen onClose={onClose} onSave={onSave} />);
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Novo Portal');
    await user.type(screen.getByLabelText('Tipo'), 'Dashboard');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nao foi salvo/i);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('atualiza e exclui o projeto em edicao', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ProjectModal isOpen onClose={vi.fn()} onSave={vi.fn()} onUpdate={onUpdate} onDelete={onDelete} project={project} />);
    await user.clear(screen.getByLabelText('Nome do Projeto'));
    await user.type(screen.getByLabelText('Nome do Projeto'), 'Portal 2');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(onUpdate).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'Portal 2' }));
    await user.click(screen.getByRole('button', { name: /deletar/i }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });
});
