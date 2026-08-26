import React, { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useApp } from '../../../AppContext';
import type { AtividadeDoRepo } from '../../../api/_atividade';

type Estado = 'parado' | 'buscando' | 'ok' | 'erro';

/**
 * Puxa a atividade recente do GitHub e grava nos projetos.
 *
 * A chamada passa por `/api/github-atividade` em vez de ir direto na API
 * do GitHub porque os repositórios privados exigem token, e token não pode
 * chegar ao navegador.
 */
const AtualizarDoGitHub: React.FC = () => {
  const { projects, updateProject } = useApp();
  const [estado, setEstado] = useState<Estado>('parado');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [falhas, setFalhas] = useState<AtividadeDoRepo[]>([]);

  const comRepo = projects.filter((p) => p.repo);

  const atualizar = async () => {
    if (comRepo.length === 0) {
      setEstado('erro');
      setMensagem('Nenhum projeto tem repositório definido. Use "Importar" primeiro.');
      return;
    }

    setEstado('buscando');
    setMensagem(null);
    setFalhas([]);

    try {
      const resposta = await fetch('/api/github-atividade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repos: comRepo.map((p) => p.repo) }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json().catch(() => ({}));
        throw new Error(corpo.erro ?? `A função respondeu ${resposta.status}.`);
      }

      const { resultados } = (await resposta.json()) as { resultados: AtividadeDoRepo[] };

      let gravados = 0;
      for (const resultado of resultados) {
        if (!resultado.ok) continue;
        const projeto = comRepo.find((p) => p.repo === resultado.repo);
        if (!projeto) continue;

        await updateProject(projeto.id, {
          ultimoCommit: resultado.ultimoCommit,
          evolucoes30d: resultado.evolucoes30d,
          correcoes30d: resultado.correcoes30d,
        });
        gravados++;
      }

      const problemas = resultados.filter((r) => !r.ok);
      setFalhas(problemas);
      setEstado(problemas.length > 0 ? 'erro' : 'ok');
      setMensagem(
        problemas.length > 0
          ? `${gravados} atualizados, ${problemas.length} falharam.`
          : `${gravados} projetos atualizados.`
      );
    } catch (e) {
      setEstado('erro');
      setMensagem(e instanceof Error ? e.message : 'Falha ao buscar do GitHub.');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={atualizar}
        disabled={estado === 'buscando'}
        title="Puxa commits dos últimos 30 dias e reordena os cards"
        className="flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5
                   text-xs font-bold text-neutral-400 transition hover:border-lime-500/40
                   hover:text-neutral-200 disabled:opacity-50"
      >
        <RefreshCw size={14} className={estado === 'buscando' ? 'animate-spin' : undefined} />
        {estado === 'buscando' ? 'Buscando…' : 'GitHub'}
      </button>

      {mensagem && estado !== 'buscando' && (
        <div
          role="status"
          className={`absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border px-3 py-2
                      text-xs ${
                        estado === 'ok'
                          ? 'border-lime-500/30 bg-neutral-900 text-lime-300'
                          : 'border-amber-500/30 bg-neutral-900 text-amber-300'
                      }`}
        >
          <div className="flex items-start gap-2">
            {estado === 'erro' && (
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <div className="flex-1">
              <p>{mensagem}</p>
              {falhas.length > 0 && (
                <ul className="mt-1.5 space-y-1 text-[11px] text-neutral-400">
                  {falhas.slice(0, 4).map((f) => (
                    <li key={f.repo}>{f.erro}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setMensagem(null)}
                className="mt-2 text-[11px] text-neutral-500 underline hover:text-neutral-300"
              >
                fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtualizarDoGitHub;
