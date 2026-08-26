import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseAuth = vi.fn();
vi.mock('./AuthContext', () => ({ useAuth: () => mockUseAuth() }));

import AuthGate from './AuthGate';

describe('AuthGate', () => {
  beforeEach(() => mockUseAuth.mockReset());

  it('não renderiza o painel enquanto a sessão está carregando', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, error: null, signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.queryByText('PAINEL')).not.toBeInTheDocument();
  });

  it('mostra a tela de login quando não há usuário', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: null, signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.queryByText('PAINEL')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
  });

  it('renderiza o painel quando há usuário', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'abc123' }, loading: false, error: null, signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByText('PAINEL')).toBeInTheDocument();
  });

  it('mostra a mensagem de erro do login', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: 'Falha ao entrar', signIn: vi.fn(), logout: vi.fn() });
    render(<AuthGate><div>PAINEL</div></AuthGate>);
    expect(screen.getByText('Falha ao entrar')).toBeInTheDocument();
  });
});
