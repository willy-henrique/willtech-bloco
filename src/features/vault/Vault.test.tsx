import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const addVaultItem = vi.fn();
const deleteVaultItem = vi.fn();
vi.mock('../../../AppContext', () => ({
  useApp: () => ({
    vaultItems: [{ id: 'v1', title: 'Producao', content: 'secret', category: 'Login', createdAt: 1 }],
    addVaultItem, deleteVaultItem,
  }),
}));

import Vault from '../../../components/Vault';

beforeEach(() => {
  addVaultItem.mockReset().mockResolvedValue(undefined);
  deleteVaultItem.mockReset().mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('Vault', () => {
  it('salva um segredo e fecha o formulario', async () => {
    const user = userEvent.setup();
    render(<Vault expanded />);
    await user.click(screen.getByRole('button', { name: /guardar item/i }));
    await user.type(screen.getByPlaceholderText('Ex.: Banco de produção'), 'Homologacao');
    await user.type(screen.getByPlaceholderText(/Cole a credencial/i), 'token-123');
    await user.click(screen.getByRole('button', { name: /proteger no cofre/i }));
    expect(addVaultItem).toHaveBeenCalledWith({ title: 'Homologacao', content: 'token-123', category: 'Login' });
    await waitFor(() => expect(screen.queryByPlaceholderText('Ex.: Banco de produção')).not.toBeInTheDocument());
  });

  it('mantem o formulario e avisa quando salvar falha', async () => {
    addVaultItem.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<Vault />);
    await user.click(screen.getByRole('button', { name: /guardar item/i }));
    await user.type(screen.getByPlaceholderText('Ex.: Banco de produção'), 'Falha');
    await user.type(screen.getByPlaceholderText(/Cole a credencial/i), 'segredo');
    await user.click(screen.getByRole('button', { name: /proteger no cofre/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nao foi salvo/i);
    expect(screen.getByPlaceholderText('Ex.: Banco de produção')).toBeInTheDocument();
  });

  it('revela e exclui um segredo confirmado', async () => {
    const user = userEvent.setup();
    render(<Vault />);
    await user.click(screen.getByRole('button', { name: 'Exibir' }));
    expect(screen.getByText('secret')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(deleteVaultItem).toHaveBeenCalledWith('v1');
  });
});
