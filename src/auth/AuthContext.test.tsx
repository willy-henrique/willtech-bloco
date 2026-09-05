import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const onAuthStateChanged = vi.fn();
const signInWithPopup = vi.fn();
const signInWithEmailAndPassword = vi.fn();
const signOut = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...a: unknown[]) => onAuthStateChanged(...a),
  signInWithPopup: (...a: unknown[]) => signInWithPopup(...a),
  signInWithEmailAndPassword: (...a: unknown[]) => signInWithEmailAndPassword(...a),
  signOut: (...a: unknown[]) => signOut(...a),
}));

vi.mock('../config/firebase', () => ({ auth: {}, googleProvider: {} }));

import { AuthProvider, useAuth } from './AuthContext';

/** Expõe o estado do contexto para o teste inspecionar. */
const Sonda: React.FC = () => {
  const { user, loading, error, busy, signInWithGoogle, signInWithEmail, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="busy">{String(busy)}</span>
      <span data-testid="user">{user ? (user as { uid: string }).uid : 'nenhum'}</span>
      <span data-testid="error">{error ?? 'sem erro'}</span>
      <button onClick={signInWithGoogle}>google</button>
      <button onClick={() => signInWithEmail('a@b.com', 'senha')}>email</button>
      <button onClick={logout}>sair</button>
    </div>
  );
};

const montar = () =>
  render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>
  );

/** Simula o Firebase avisando quem está logado. */
let avisarSessao: (u: unknown) => void = () => {};

beforeEach(() => {
  vi.clearAllMocks();
  onAuthStateChanged.mockImplementation((_auth, cb) => {
    avisarSessao = cb;
    return () => {};
  });
});

const erroFirebase = (code: string) => Object.assign(new Error(code), { code });

describe('AuthProvider — sessão', () => {
  it('começa carregando, antes do Firebase responder', () => {
    montar();
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('sai do carregando quando o Firebase responde que não há ninguém', async () => {
    montar();
    act(() => avisarSessao(null));
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('nenhum');
  });

  it('publica o usuário quando há sessão', async () => {
    montar();
    act(() => avisarSessao({ uid: 'abc123' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('abc123'));
  });

  it('cancela a inscrição ao desmontar, para não vazar listener', () => {
    const cancelar = vi.fn();
    onAuthStateChanged.mockImplementation(() => cancelar);
    montar().unmount();
    expect(cancelar).toHaveBeenCalled();
  });
});

describe('AuthProvider — erros traduzidos', () => {
  it.each([
    ['auth/invalid-credential', /e-mail ou senha incorretos/i],
    ['auth/wrong-password', /e-mail ou senha incorretos/i],
    ['auth/user-not-found', /e-mail ou senha incorretos/i],
    ['auth/invalid-email', /e-mail inv[áa]lido/i],
    ['auth/user-disabled', /desativada/i],
    ['auth/too-many-requests', /muitas tentativas/i],
    ['auth/operation-not-allowed', /n[ãa]o est[áa] ativado/i],
    ['auth/unauthorized-domain', /dom[íi]nio n[ãa]o est[áa] autorizado/i],
    ['auth/network-request-failed', /sem conex[ãa]o/i],
  ])('traduz %s', async (code, esperado) => {
    signInWithEmailAndPassword.mockRejectedValue(erroFirebase(code));
    montar();

    await userEvent.setup().click(screen.getByText('email'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(esperado));
  });

  it('usa mensagem genérica para código desconhecido', async () => {
    signInWithEmailAndPassword.mockRejectedValue(erroFirebase('auth/coisa-nova'));
    montar();

    await userEvent.setup().click(screen.getByText('email'));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(/n[ãa]o foi poss[íi]vel entrar/i)
    );
  });
});

describe('AuthProvider — login com Google', () => {
  it('não trata popup fechado pelo usuário como erro', async () => {
    signInWithPopup.mockRejectedValue(erroFirebase('auth/popup-closed-by-user'));
    montar();

    await userEvent.setup().click(screen.getByText('google'));
    await waitFor(() => expect(screen.getByTestId('busy')).toHaveTextContent('false'));
    expect(screen.getByTestId('error')).toHaveTextContent('sem erro');
  });

  it('não trata popup cancelado como erro', async () => {
    signInWithPopup.mockRejectedValue(erroFirebase('auth/cancelled-popup-request'));
    montar();

    await userEvent.setup().click(screen.getByText('google'));
    await waitFor(() => expect(screen.getByTestId('busy')).toHaveTextContent('false'));
    expect(screen.getByTestId('error')).toHaveTextContent('sem erro');
  });

  it('libera o busy mesmo quando o login falha', async () => {
    signInWithPopup.mockRejectedValue(erroFirebase('auth/network-request-failed'));
    montar();

    await userEvent.setup().click(screen.getByText('google'));
    await waitFor(() => expect(screen.getByTestId('busy')).toHaveTextContent('false'));
  });
});

describe('AuthProvider — entrada por e-mail', () => {
  it('tira espaços em volta do e-mail antes de enviar', async () => {
    signInWithEmailAndPassword.mockResolvedValue({});
    const { rerender } = montar();

    const Sonda2: React.FC = () => {
      const { signInWithEmail } = useAuth();
      return <button onClick={() => signInWithEmail('  a@b.com  ', 'senha')}>enviar</button>;
    };
    rerender(
      <AuthProvider>
        <Sonda2 />
      </AuthProvider>
    );

    await userEvent.setup().click(screen.getByText('enviar'));
    await waitFor(() =>
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.com', 'senha')
    );
  });

  it('limpa o erro anterior ao tentar de novo', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(erroFirebase('auth/invalid-email'));
    montar();
    const user = userEvent.setup();

    await user.click(screen.getByText('email'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent(/inv[áa]lido/i));

    signInWithEmailAndPassword.mockResolvedValueOnce({});
    await user.click(screen.getByText('email'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('sem erro'));
  });
});

describe('AuthProvider — uso incorreto', () => {
  it('explica que useAuth precisa do provider', () => {
    const semProvider = () => render(<Sonda />);
    expect(semProvider).toThrow(/AuthProvider/);
  });
});
