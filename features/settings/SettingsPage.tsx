import React, { lazy, Suspense, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useTheme, ThemePreference } from '../../hooks/useTheme';
import { Button } from '../../components/ui/Button';

const FinanceHub = lazy(() => import('../../components/FinanceHub'));
const Vault = lazy(() => import('../../components/Vault'));
const SnippetManager = lazy(() => import('../../components/SnippetManager'));

type Tool = 'none' | 'finance' | 'vault' | 'snippets';

export const SettingsPage: React.FC = () => {
  const { preference, setPreference } = useTheme();
  const [tool, setTool] = useState<Tool>('none');

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Preferências e ferramentas legadas" />

      <section className="mb-8 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="section-title mb-3">Aparência</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['system', 'Sistema'],
              ['light', 'Claro'],
              ['dark', 'Escuro'],
            ] as [ThemePreference, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setPreference(id)}
              className={`min-h-11 rounded-full px-4 text-sm ${
                preference === id
                  ? 'bg-[var(--primary)] text-white dark:text-[#0f1412]'
                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="section-title mb-3">Ferramentas OPS</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Mantidas fora da navegação principal. Seus dados continuam preservados.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={() => setTool('finance')}>
            Finance Hub
          </Button>
          <Button variant="soft" onClick={() => setTool('vault')}>
            Vault
          </Button>
          <Button variant="soft" onClick={() => setTool('snippets')}>
            Snippets
          </Button>
          {tool !== 'none' && (
            <Button variant="ghost" onClick={() => setTool('none')}>
              Fechar
            </Button>
          )}
        </div>
        {tool !== 'none' && (
          <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-neutral-950 text-neutral-200">
            <Suspense fallback={<p className="p-4 text-sm">Carregando…</p>}>
              {tool === 'finance' && <FinanceHub />}
              {tool === 'vault' && (
                <div className="p-4">
                  <Vault />
                </div>
              )}
              {tool === 'snippets' && (
                <div className="p-4">
                  <SnippetManager />
                </div>
              )}
            </Suspense>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="section-title mb-3">IA (futuro)</h2>
        <p className="text-sm text-[var(--muted)]">
          A arquitetura já expõe `AssistantPort`, tool schemas e retrieval de contexto. Nenhum
          modelo está conectado ainda — a busca local cobre perguntas simples via Tudo.
        </p>
      </section>
    </div>
  );
};
