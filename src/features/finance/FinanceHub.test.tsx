import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import FinanceHub from '../../../components/FinanceHub';

const personal = { id: 'p', description: 'Conta pessoal', category: 'Outros', dueDate: '2026-08-20', amount: 100, currency: 'BRL', type: 'expense', status: 'paid', context: 'pessoal', createdAt: 1 };
const business = { id: 'b', description: 'Cliente empresa', category: 'Receitas de Projetos', dueDate: '2026-08-20', amount: 1000, currency: 'BRL', type: 'income', status: 'received', context: 'business', createdAt: 1 };

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('willtech_finance_transactions', JSON.stringify([personal, business]));
  localStorage.setItem('willtech_finance_goals', '[]');
});

describe('FinanceHub', () => {
  it('filtra lista e totais pela conta pessoal ou business', async () => {
    const user = userEvent.setup();
    render(<FinanceHub embedded />);
    expect(screen.getByText('Conta pessoal')).toBeInTheDocument();
    expect(screen.queryByText('Cliente empresa')).not.toBeInTheDocument();
    expect(screen.getByText('Liquidado').closest('div')?.parentElement).toHaveTextContent(/-R\$\s*100,00/);

    await user.click(screen.getByRole('button', { name: /business/i }));
    expect(screen.getByText('Cliente empresa')).toBeInTheDocument();
    expect(screen.queryByText('Conta pessoal')).not.toBeInTheDocument();
    expect(screen.getByText('Liquidado').closest('div')?.parentElement).toHaveTextContent(/R\$\s*1\.000,00/);
  });

  it('disponibiliza categoria criada ao cadastrar transacao', async () => {
    const user = userEvent.setup();
    render(<FinanceHub embedded />);
    await user.click(screen.getByRole('button', { name: /nova categoria/i }));
    await user.type(screen.getByPlaceholderText('Nova categoria...'), 'Impostos{Enter}');
    await user.click(screen.getByRole('button', { name: /nova transação/i }));
    const dialog = screen.getByRole('button', { name: /^salvar$/i }).closest('form')!;
    const selects = within(dialog).getAllByRole('combobox');
    expect(within(selects[2]).getByRole('option', { name: 'Impostos' })).toBeInTheDocument();
    await user.type(within(dialog).getByPlaceholderText('Ex: Aluguel, Vercel Pro...'), 'DAS');
    await user.selectOptions(selects[2], 'Impostos');
    await user.type(within(dialog).getByPlaceholderText('0,00'), '150,00');
    await user.click(within(dialog).getByRole('button', { name: /^salvar$/i }));
    const row = screen.getByText('DAS').closest('tr')!;
    expect(within(row).getByText('Impostos')).toBeInTheDocument();
  });
});
