import React, { useState } from 'react';
import {
  ArrowRight,
  Blocks,
  FolderKanban,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from './AuthContext';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, error, busy } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password || busy) return;
    void signInWithEmail(email, password);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0b0e0d] text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(52,211,153,0.10),transparent_34rem)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <div className="relative mx-auto grid min-h-dvh max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden flex-col justify-between border-r border-white/[0.06] px-10 py-9 lg:flex xl:px-16 xl:py-12">
          <div className="flex items-center gap-3">
            <div className="brand-mark grid h-11 w-11 place-items-center rounded-[15px] text-[#07110c] shadow-[0_14px_40px_rgba(52,211,153,0.16)]">
              <Blocks size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-[-0.025em] text-white">WillTech</span>
                <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.08] px-1.5 py-0.5 text-[8px] font-bold tracking-[0.16em] text-emerald-300">
                  OPS
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-neutral-600">Central de operações</p>
            </div>
          </div>

          <div className="max-w-[610px] py-16">
            <p className="mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.21em] text-emerald-300/75">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.7)]" />
              Workspace privado
            </p>
            <h1 className="max-w-[580px] text-[46px] font-semibold leading-[1.05] tracking-[-0.055em] text-white xl:text-[58px]">
              Menos ruído. <span className="text-neutral-550 text-neutral-500">Mais controle sobre a operação.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-7 text-neutral-500">
              Projetos, prioridades, credenciais e finanças conectados em um workspace pessoal feito para decidir e agir rápido.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { icon: FolderKanban, title: 'Projetos', text: 'Contexto sempre acessível' },
                { icon: ListChecks, title: 'Prioridades', text: 'Próximo passo claro' },
                { icon: LockKeyhole, title: 'Cofre', text: 'Dados sensíveis protegidos' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-[18px] border border-white/[0.06] bg-white/[0.018] p-4">
                  <Icon size={17} className="text-emerald-300/70" />
                  <p className="mt-4 text-xs font-medium text-neutral-300">{title}</p>
                  <p className="mt-1 text-[10px] leading-4 text-neutral-700">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-700">
            <ShieldCheck size={13} className="text-emerald-300/50" />
            Acesso restrito e dados sincronizados com segurança
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-9 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="brand-mark grid h-10 w-10 place-items-center rounded-[14px] text-[#07110c]">
                  <Blocks size={20} />
                </div>
                <span className="text-base font-semibold text-white">WillTech</span>
              </div>
              <span className="rounded-md border border-emerald-400/15 bg-emerald-400/[0.08] px-2 py-1 text-[8px] font-bold tracking-[0.16em] text-emerald-300">
                OPS
              </span>
            </div>

            <div className="rounded-[26px] border border-white/[0.075] bg-[#121614]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
              <div className="grid h-11 w-11 place-items-center rounded-[14px] border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
                <LockKeyhole size={19} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-white">Bem-vindo de volta</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">Entre com a conta autorizada para acessar seu workspace.</p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-medium text-neutral-500">E-mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@willtech.com.br"
                    aria-label="E-mail"
                    autoComplete="username"
                    disabled={busy}
                    className="field-control h-12 px-4 text-sm disabled:opacity-40"
                  />
                </label>
                <label className="block">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-neutral-500">Senha</span>
                    <span className="text-[9px] text-neutral-700">Acesso restrito</span>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    aria-label="Senha"
                    autoComplete="current-password"
                    disabled={busy}
                    className="field-control h-12 px-4 text-sm disabled:opacity-40"
                  />
                </label>

                {error && (
                  <p role="alert" className="rounded-xl border border-rose-400/15 bg-rose-400/[0.06] px-3.5 py-3 text-xs leading-5 text-rose-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || !email.trim() || !password}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 text-sm font-semibold text-[#07110c] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {busy ? 'Autenticando...' : 'Entrar no workspace'}
                  {!busy && <ArrowRight size={16} />}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-700">ou continue com</span>
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={busy}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-neutral-300 transition hover:border-white/[0.13] hover:bg-white/[0.045] hover:text-white disabled:opacity-40"
              >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-white text-[10px] font-bold text-[#1f6feb]">G</span>
                Entrar com Google
              </button>
            </div>

            <p className="mt-5 text-center text-[10px] leading-5 text-neutral-700">
              Este é um ambiente privado. Apenas contas previamente autorizadas podem entrar.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginScreen;
