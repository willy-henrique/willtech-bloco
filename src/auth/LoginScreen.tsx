import React from 'react';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from './AuthContext';

const LoginScreen: React.FC = () => {
  const { signIn, error } = useAuth();

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

        <button
          type="button"
          onClick={signIn}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-4 py-3
                     text-sm font-medium text-neutral-950 transition hover:bg-lime-400
                     focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2
                     focus:ring-offset-neutral-950"
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
