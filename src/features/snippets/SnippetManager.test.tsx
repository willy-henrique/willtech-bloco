import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const addSnippet = vi.fn();
const deleteSnippet = vi.fn();
vi.mock('../../../AppContext', () => ({
  useApp: () => ({
    snippets: [{ id: 's1', title: 'Clientes ativos', code: 'select * from clients', language: 'sql' }],
    addSnippet,
    deleteSnippet,
  }),
}));

import SnippetManager from '../../../components/SnippetManager';

beforeEach(() => {
  addSnippet.mockReset().mockResolvedValue(undefined);
  deleteSnippet.mockReset().mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('SnippetManager', () => {
  it('aguarda o banco antes de fechar o formulario', async () => {
    const user = userEvent.setup();
    render(<SnippetManager />);
    await user.click(screen.getByRole('button', { name: /adicionar snippet/i }));
    await user.type(screen.getByPlaceholderText('Query Title'), 'Relatorio');
    await user.type(screen.getByPlaceholderText(/Write your SQL/i), 'select 1');
    await user.click(screen.getByRole('button', { name: /salvar snippet/i }));
    await waitFor(() => expect(addSnippet).toHaveBeenCalledWith(expect.objectContaining({ title: 'Relatorio', code: 'select 1' })));
    await waitFor(() => expect(screen.queryByPlaceholderText('Query Title')).not.toBeInTheDocument());
  });

  it('mantem o formulario aberto e mostra erro se salvar falhar', async () => {
    addSnippet.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<SnippetManager />);
    await user.click(screen.getByRole('button', { name: /adicionar snippet/i }));
    await user.type(screen.getByPlaceholderText('Query Title'), 'Falha');
    await user.type(screen.getByPlaceholderText(/Write your SQL/i), 'select 2');
    await user.click(screen.getByRole('button', { name: /salvar snippet/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nao foi salvo/i);
    expect(screen.getByPlaceholderText('Query Title')).toBeInTheDocument();
  });

  it('exclui um snippet confirmado', async () => {
    render(<SnippetManager />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Excluir Clientes ativos' }));
    expect(deleteSnippet).toHaveBeenCalledWith('s1');
  });
});
