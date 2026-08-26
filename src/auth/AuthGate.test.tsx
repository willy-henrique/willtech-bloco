import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const signInWithGoogle = vi.fn();
const signInWithEmail = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('./AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import AuthGate from './AuthGate';

const sessao = (over: Partial<ReturnType<typeof base>> = {}) => ({ ...base(), ...over });
const base = () => ({
  user: null as { uid: string } | null,
  loading: false,
  error: null as string | null,
  busy: false,
  signInWithGoogle,
  signInWithEmail,
  logout: vi.fn(),
});

beforeEach(() => {
  mockUseAuth.mockReset();
  signInWithGoogle.mockReset();
  signInWithEmail.mockReset();
});

describe('AuthGate', () => {
  it('não renderiza o painel enquanto a sessão está carregando', () => {
    mockUseAuth.mockReturnValue(sessao({ loading: true }));
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.queryByText('PAINEL')).not.toBeInTheDocument();
  });

  it('mostra a tela de login quando não há usuário', () => {
    mockUseAuth.mockReturnValue(sessao());
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.queryByText('PAINEL')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
  });

  it('renderiza o painel quando há usuário', () => {
    mockUseAuth.mockReturnValue(sessao({ user: { uid: 'abc123' } }));
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByText('PAINEL')).toBeInTheDocument();
  });

  it('mostra a mensagem de erro do login', () => {
    mockUseAuth.mockReturnValue(sessao({ error: 'E-mail ou senha incorretos.' }));
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByText('E-mail ou senha incorretos.')).toBeInTheDocument();
  });
});

describe('LoginScreen — e-mail e senha', () => {
  it('oferece os campos de e-mail e senha', () => {
    mockUseAuth.mockReturnValue(sessao());
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('entra com e-mail e senha', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue(sessao());
    render(<AuthGate><div>PAINEL</div></AuthGate>);

    await user.type(screen.getByLabelText('E-mail'), 'willydev01@gmail.com');
    await user.type(screen.getByLabelText('Senha'), 'senha-secreta');
    await user.click(screen.getByRole('button', { name: /entrar no workspace/i }));

    expect(signInWithEmail).toHaveBeenCalledWith('willydev01@gmail.com', 'senha-secreta');
  });

  it('não envia com os campos vazios', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue(sessao());
    render(<AuthGate><div>PAINEL</div></AuthGate>);

    await user.click(screen.getByRole('button', { name: /entrar no workspace/i }));
    expect(signInWithEmail).not.toHaveBeenCalled();
  });

  it('mantém o login com Google disponível', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue(sessao());
    render(<AuthGate><div>PAINEL</div></AuthGate>);

    await user.click(screen.getByRole('button', { name: /entrar com google/i }));
    expect(signInWithGoogle).toHaveBeenCalled();
  });
});
