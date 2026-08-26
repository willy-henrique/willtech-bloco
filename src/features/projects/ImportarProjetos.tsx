import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DownloadCloud, Plus, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../../AppContext';
import { planejarImportacao } from './planejarImportacao';
import { CATALOGO } from './catalogo.seed';

type Fase = 'revisando' | 'gravando' | 'concluido' | 'erro';

const ImportarProjetos: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { projects, addProject, updateProject } = useApp();
  const [fase, setFase] = useState<Fase>('revisando');
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const plano = useMemo(() => planejarImportacao(CATALOGO, projects), [projects]);
  const total = plano.criar.length + plano.atualizar.length;

  const executar = async () => {
    setFase('gravando');
    setProgresso(0);
    setErro(null);

    try {
      let feitos = 0;

      for (const item of plano.criar) {
        await addProject({
          name: item.name,
          type: item.type,
          status: item.status,
          progress: item.progress,
          color: item.color,
          stack: item.stack,
          aliases: item.aliases,
          vocab: item.vocab,
          ...(item.repo ? { repo: item.repo } : {}),
          ultimoCommit: item.ultimoCommit,
          evolucoes30d: item.evolucoes30d,
          correcoes30d: item.correcoes30d,
          historico: item.historico,
        });
        setProgresso(++feitos);
      }

      for (const item of plano.atualizar) {
        await updateProject(item.existente.id, item.patch);
        setProgresso(++feitos);
      }

      setFase('concluido');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gravar no Firestore.');
      setFase('erro');
    }
  };

  const fechar = () => {
    setFase('revisando');
    setProgresso(0);
    setErro(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fase === 'gravando' ? undefined : fechar}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            role="dialog"
            aria-label="Importar projetos"
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(92vw,560px)]
                       -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl
                       border border-neutral-800 bg-neutral-950"
          >
            <header className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <DownloadCloud className="h-4 w-4 text-lime-400" aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Importar projetos</h2>
              </div>
              {fase !== 'gravando' && (
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar"
                  className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-900 hover:text-neutral-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              {fase === 'revisando' && (
                <>
                  <p className="mb-4 text-sm text-neutral-400">
                    Lido dos repositórios em <code className="text-neutral-300">C:\willydev</code>.
                    Só entram projetos com commit nos últimos 30 dias.{' '}
                    <strong className="text-neutral-300">Nada é apagado.</strong>
                  </p>

                  {plano.criar.length > 0 && (
                    <section className="mb-4">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-lime-400">
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Criar ({plano.criar.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {plano.criar.map((p) => (
                          <li
                            key={p.name}
                            className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-sm font-medium text-neutral-200">{p.name}</span>
                              <span className="ml-auto text-[10px] text-neutral-600">{p.stack}</span>
                            </div>
                            <p className="mt-1 pl-4 text-xs text-neutral-500">
                              {p.evolucoes30d} evoluções · {p.correcoes30d} correções ·{' '}
                              {p.aliases.length} apelidos · {p.vocab.length} termos
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {plano.atualizar.length > 0 && (
                    <section className="mb-4">
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Enriquecer ({plano.atualizar.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {plano.atualizar.map((a) => (
                          <li
                            key={a.existente.id}
                            className="rounded-lg border border-neutral-900 bg-neutral-900/40 px-3 py-2"
                          >
                            <span className="text-sm font-medium text-neutral-200">
                              {a.existente.name}
                            </span>
                            <p className="mt-1 text-xs text-neutral-500">
                              {a.mudancas.join(' · ')}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {plano.semMudanca.length > 0 && (
                    <p className="mb-2 text-xs text-neutral-600">
                      {plano.semMudanca.length} já estão completos e não serão tocados.
                    </p>
                  )}

                  {plano.foraDoRecorte.length > 0 && (
                    <p className="text-xs text-neutral-600">
                      {plano.foraDoRecorte.length} fora do recorte de 30 dias:{' '}
                      {plano.foraDoRecorte.map((f) => f.nome).join(', ')}.
                    </p>
                  )}

                  {total === 0 && (
                    <p className="text-sm text-neutral-400">
                      Nada a fazer — o painel já está em dia com o catálogo.
                    </p>
                  )}
                </>
              )}

              {fase === 'gravando' && (
                <div className="py-8 text-center">
                  <div
                    role="status"
                    aria-label="Gravando"
                    className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-800 border-t-lime-400"
                  />
                  <p className="text-sm text-neutral-400">
                    Gravando {progresso} de {total}…
                  </p>
                </div>
              )}

              {fase === 'concluido' && (
                <div className="py-8 text-center">
                  <Check className="mx-auto mb-3 h-8 w-8 text-lime-400" aria-hidden="true" />
                  <p className="text-sm text-neutral-300">
                    {plano.criar.length} criados, {plano.atualizar.length} enriquecidos.
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    A captura já reconhece esses projetos pelo assunto.
                  </p>
                </div>
              )}

              {fase === 'erro' && (
                <div className="py-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" aria-hidden="true" />
                  <p className="text-sm text-red-400">{erro}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Gravou {progresso} de {total} antes de parar. Rodar de novo é seguro — ele
                    recalcula o que falta.
                  </p>
                </div>
              )}
            </div>

            <footer className="flex justify-end gap-2 border-t border-neutral-900 px-5 py-4">
              {fase === 'revisando' && (
                <>
                  <button
                    type="button"
                    onClick={fechar}
                    className="rounded-lg px-4 py-2 text-sm text-neutral-400 transition hover:text-neutral-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executar}
                    disabled={total === 0}
                    className="rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-neutral-950
                               transition hover:bg-lime-400 disabled:opacity-30"
                  >
                    Importar {total > 0 ? total : ''}
                  </button>
                </>
              )}
              {(fase === 'concluido' || fase === 'erro') && (
                <button
                  type="button"
                  onClick={fechar}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200
                             transition hover:bg-neutral-700"
                >
                  Fechar
                </button>
              )}
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ImportarProjetos;
