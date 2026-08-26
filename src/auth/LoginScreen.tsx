import React, { useState } from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from './AuthContext';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, error, busy } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || busy) return;
    void signInWithEmail(email, password);
  };

  const campo =
    'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm ' +
    'text-neutral-200 placeholder:text-neutral-600 focus:border-lime-500/40 ' +
    'focus:outline-none disabled:opacity-50';

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-lime-400" aria-hidden="true" />
          <h1 className="text-lg font-semibold tracking-tight">WillTech Bloco</h1>
        </div>

        <p className="text-sm text-neutral-400 mb-6">
          Painel restrito. Entre com a conta autorizada para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            aria-label="E-mail"
            autoComplete="username"
            disabled={busy}
            className={campo}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            aria-label="Senha"
            autoComplete="current-password"
            disabled={busy}
            className={campo}
          />
          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="w-full rounded-lg bg-lime-500 px-4 py-3 text-sm font-medium
                       text-neutral-950 transition hover:bg-lime-400
                       focus:outline-none focus:ring-2 focus:ring-lime-400
                       focus:ring-offset-2 focus:ring-offset-neutral-950
                       disabled:opacity-40"
          >
            Entrar
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-neutral-800" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">ou</span>
          <span className="h-px flex-1 bg-neutral-800" />
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 rounded-lg border
                     border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-300
                     transition hover:border-neutral-700 hover:bg-neutral-900
                     focus:outline-none focus:ring-2 focus:ring-neutral-600
                     disabled:opacity-40"
        >
          <LogIn className="w-4 h-4" aria-hidden="true" />
          Entrar com Google
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
