import React, { useMemo } from 'react';
import { GitCommitVertical, Sparkles, Wrench, RefreshCw, History } from 'lucide-react';
import type { EventoDeCommit, Project } from '../../../types';

const ESTILO: Record<EventoDeCommit['tipo'], { rotulo: string; ponto: string; texto: string }> = {
  evoluiu: { rotulo: 'Evoluiu', ponto: 'bg-emerald-400', texto: 'text-emerald-300' },
  corrigiu: { rotulo: 'Corrigiu', ponto: 'bg-amber-400', texto: 'text-amber-300' },
  melhorou: { rotulo: 'Melhorou', ponto: 'bg-sky-400', texto: 'text-sky-300' },
  manutencao: { rotulo: 'Manutenção', ponto: 'bg-neutral-600', texto: 'text-neutral-400' },
  outro: { rotulo: 'Outro', ponto: 'bg-neutral-700', texto: 'text-neutral-500' },
};

const formatarDia = (iso: string) => {
  const data = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(data.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  }).format(data);
};

const Indicador: React.FC<{
  icone: React.ElementType;
  valor: React.ReactNode;
  rotulo: string;
  tom: string;
}> = ({ icone: Icone, valor, rotulo, tom }) => (
  <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
    <Icone size={15} className={tom} />
    <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{valor}</p>
    <p className="mt-0.5 text-[10px] text-neutral-600">{rotulo}</p>
  </div>
);

/**
 * Linha do tempo do que aconteceu no repositório do projeto.
 *
 * Os commits vêm classificados em evoluiu / corrigiu / melhorou, porque
 * quem abre esta tela quer saber se o projeto ANDOU ou se estava apagando
 * incêndio — não se o prefixo do commit era `perf` ou `refactor`.
 */
const EvolucaoProjeto: React.FC<{ project: Project }> = ({ project }) => {
  const porDia = useMemo(() => {
    const grupos = new Map<string, EventoDeCommit[]>();
    for (const evento of project.historico ?? []) {
      const lista = grupos.get(evento.data) ?? [];
      lista.push(evento);
      grupos.set(evento.data, lista);
    }
    return [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [project.historico]);

  if (!project.repo) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-[22px] border border-dashed border-white/10 px-6 text-center">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-neutral-500">
          <History size={19} />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200">Sem repositório vinculado</h3>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Este projeto não tem um repositório no GitHub definido, então não há histórico para
          acompanhar. Use <strong className="text-neutral-300">Importar projetos</strong> no painel
          para vincular.
        </p>
      </div>
    );
  }

  if (porDia.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-[22px] border border-dashed border-white/10 px-6 text-center">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-neutral-500">
          <RefreshCw size={19} />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200">Histórico ainda não carregado</h3>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          Volte ao painel e clique em <strong className="text-neutral-300">GitHub</strong> para
          puxar os commits de <span className="font-mono text-neutral-400">{project.repo}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Indicador
          icone={Sparkles}
          valor={project.evolucoes30d ?? 0}
          rotulo="Evoluções em 30 dias"
          tom="text-emerald-300/70"
        />
        <Indicador
          icone={Wrench}
          valor={project.correcoes30d ?? 0}
          rotulo="Correções em 30 dias"
          tom="text-amber-300/70"
        />
        <Indicador
          icone={GitCommitVertical}
          valor={project.ultimoCommit ? formatarDia(project.ultimoCommit).split(',')[1]?.trim() : '—'}
          rotulo="Último commit"
          tom="text-sky-300/70"
        />
      </div>

      <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-5">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Linha do tempo
          </h3>
          <a
            href={`https://github.com/${project.repo}/commits`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11px] text-neutral-600 underline underline-offset-2 transition hover:text-neutral-300"
          >
            ver no GitHub
          </a>
        </div>

        <ol
          aria-label="Linha do tempo"
          className="relative space-y-6 border-l border-white/[0.07] pl-5"
        >
          {porDia.map(([dia, eventos]) => (
            <li key={dia}>
              <span className="absolute -left-[3px] mt-1.5 h-1.5 w-1.5 rounded-full bg-white/25" />
              <p className="mb-2.5 text-[11px] font-medium capitalize text-neutral-500">
                {formatarDia(dia)}
              </p>

              <ul className="space-y-2">
                {eventos.map((evento, i) => {
                  const estilo = ESTILO[evento.tipo];
                  return (
                    <li key={`${dia}-${i}`} className="flex items-start gap-2.5">
                      <span
                        className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${estilo.ponto}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-6 text-neutral-300">{evento.assunto}</p>
                        <span className={`text-[10px] font-medium ${estilo.texto}`}>
                          {estilo.rotulo}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default EvolucaoProjeto;
