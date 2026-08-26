import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TransactionModal from '../../../components/TransactionModal';

describe('TransactionModal', () => {
  it('salva valor brasileiro e categoria personalizada', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <TransactionModal
        isOpen
        onClose={vi.fn()}
        onSave={onSave}
        transaction={null}
        categories={['Outros', 'Impostos']}
      />,
    );

    await user.type(screen.getByPlaceholderText('Ex: Aluguel, Vercel Pro...'), 'DAS mensal');
    await user.selectOptions(screen.getAllByRole('combobox')[2], 'Impostos');
    await user.type(screen.getByPlaceholderText('0,00'), '1.234,56');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      description: 'DAS mensal',
      category: 'Impostos',
      amount: 1234.56,
    }));
  });

  it('nao salva valor invalido', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<TransactionModal isOpen onClose={vi.fn()} onSave={onSave} transaction={null} />);
    await user.type(screen.getByPlaceholderText('Ex: Aluguel, Vercel Pro...'), 'Teste');
    await user.type(screen.getByPlaceholderText('0,00'), 'abc');
    await user.click(screen.getByRole('button', { name: /^salvar$/i }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
