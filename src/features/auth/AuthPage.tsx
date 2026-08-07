import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '../../constants/defaults';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema, registerSchema } from '../../schemas/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

type Mode = 'login' | 'register' | 'reset';

export function AuthPage() {
  const { user, loading, login, register, loginLocal, resetPassword, firebaseReady } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        toast.success('E-mail de recuperação enviado');
        setMode('login');
        return;
      }

      if (mode === 'login') {
        if (!firebaseReady) {
          toast.info('Firebase indisponível', 'Use o modo local neste dispositivo.');
          return;
        }
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          const next: Record<string, string> = {};
          parsed.error.issues.forEach((issue) => {
            next[String(issue.path[0])] = issue.message;
          });
          setErrors(next);
          return;
        }
        await login(email, password);
        toast.success('Sessão iniciada');
        return;
      }

      const parsed = registerSchema.safeParse({
        email,
        password,
        confirmPassword,
        displayName,
      });
      if (!parsed.success) {
        const next: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          next[String(issue.path[0])] = issue.message;
        });
        setErrors(next);
        return;
      }
      await register(email, password, displayName);
      toast.success('Conta criada');
    } catch (error) {
      toast.error(
        'Falha na autenticação',
        error instanceof Error ? error.message : 'Tente novamente',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-height grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between p-10">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(800px 400px at 20% 20%, rgba(63,207,142,0.25), transparent 60%), radial-gradient(700px 360px at 80% 10%, rgba(2,132,199,0.18), transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{APP_NAME}</p>
          <h1 className="mt-4 max-w-md text-4xl font-bold tracking-tight">
            Sua central pessoal de comando.
          </h1>
          <p className="mt-3 max-w-md text-text-muted">
            Organize tarefas, agenda, projetos, finanças e hábitos em um único lugar — preparado
            para a Will AI.
          </p>
        </div>
        <p className="relative text-sm text-text-subtle">{APP_TAGLINE}</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-bg-elevated p-6 shadow-md">
          <div className="mb-6 lg:hidden">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">{APP_NAME}</p>
            <h1 className="mt-2 text-2xl font-bold">Entrar</h1>
          </div>
          <h2 className="hidden text-2xl font-bold lg:block">
            {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Recuperar senha'}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {firebaseReady
              ? 'Use sua conta Firebase ou continue em modo local neste dispositivo.'
              : 'Firebase não configurado neste ambiente. Você pode continuar em modo local.'}
          </p>

          <form className="mt-6 space-y-3" onSubmit={(event) => void onSubmit(event)}>
            {mode === 'register' ? (
              <Input
                label="Nome"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                error={errors.displayName}
                required
              />
            ) : null}
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              required={mode !== 'login' || firebaseReady}
            />
            {mode !== 'reset' ? (
              <Input
                label="Senha"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
                required
              />
            ) : null}
            {mode === 'register' ? (
              <Input
                label="Confirmar senha"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={errors.confirmPassword}
                required
              />
            ) : null}

            <Button type="submit" className="w-full" loading={submitting} disabled={!firebaseReady && mode !== 'login'}>
              {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar recuperação'}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-sm">
            {mode === 'login' ? (
              <>
                <button type="button" className="text-accent" onClick={() => setMode('register')}>
                  Criar conta
                </button>
                <button
                  type="button"
                  className="ml-4 text-text-muted"
                  onClick={() => setMode('reset')}
                  disabled={!firebaseReady}
                >
                  Esqueci a senha
                </button>
              </>
            ) : (
              <button type="button" className="text-accent" onClick={() => setMode('login')}>
                Voltar ao login
              </button>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                loginLocal('Willy');
                toast.success('Modo local iniciado');
              }}
            >
              Continuar em modo local
            </Button>
            <p className="mt-2 text-xs text-text-subtle">
              Os dados ficam neste dispositivo, isolados por usuário. Ideal para uso pessoal e offline.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
