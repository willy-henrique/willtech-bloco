import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ExternalLink,
  FolderKanban,
  Link2,
  Mail,
  Search,
  Server,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { agregarContas, estatisticasInfra } from '../src/features/hub/agregarInfra';
import type { PlatformName, Project } from '../types';
import { PLATFORMS } from '../types';

export const PLATAFORMA_LABEL: Record<PlatformName, string> = {
  github: 'GitHub',
  vercel: 'Vercel',
  render: 'Render',
  firebase: 'Firebase',
  supabase: 'Supabase',
  railway: 'Railway',
  netlify: 'Netlify',
  postgres: 'Postgres',
  local: 'Local / Máquina',
  other: 'Outro',
};

interface InfraHubProps {
  onOpenProject: (id: string) => void;
}

const InfraHub: React.FC<InfraHubProps> = ({ onOpenProject }) => {
  const { projects, isLoading } = useApp();
  const [busca, setBusca] = useState('');
  const [filtroPlataforma, setFiltroPlataforma] = useState<'todas' | PlatformName>('todas');

  const contas = useMemo(() => agregarContas(projects), [projects]);
  const stats = useMemo(() => estatisticasInfra(projects), [projects]);

  const emailsPorUso = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const conta of contas) {
      const chave = conta.email.toLowerCase();
      mapa.set(chave, (mapa.get(chave) ?? 0) + conta.projetos.length);
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [contas]);

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return projects.filter((p) => {
      const bateTermo =
        !termo ||
        [p.name, p.repo, p.stack, p.ownerEmail, ...(p.aliases ?? [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termo));
      const batePlataforma =
        filtroPlataforma === 'todas' || (p.platforms ?? []).some((pl) => pl.platform === filtroPlataforma);
      return bateTermo && batePlataforma;
    });
  }, [projects, busca, filtroPlataforma]);

  const plataformasPresentes = useMemo(() => {
    const conjunto = new Set<PlatformName>();
    for (const p of projects) for (const pl of p.platforms ?? []) conjunto.add(pl.platform);
    return PLATFORMS.filter((pl) => conjunto.has(pl));
  }, [projects]);

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-neutral-500">Carregando hub de infraestrutura…</p>;
  }

  return (
    <section>
      <div className="mb-6 md:mb-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.21em] text-emerald-300/65">Hub de infraestrutura</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white md:text-[30px]">Todos os projetos, contas e endpoints</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          Quem hospeda o quê, com qual e-mail de login, e por onde cada projeto responde.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { rotulo: 'Projetos', valor: stats.projetos, icon: FolderKanban },
          { rotulo: 'Com dados de infra', valor: stats.comInfra, icon: Server },
          { rotulo: 'E-mails de login', valor: stats.emailsUnicos, icon: Mail },
          { rotulo: 'Contas por plataforma', valor: stats.contas, icon: Link2 },
          { rotulo: 'Endpoints', valor: stats.endpoints, icon: ArrowUpRight },
        ].map(({ rotulo, valor, icon: Icon }) => (
          <div key={rotulo} className="surface-panel rounded-2xl border border-white/[0.07] p-4">
            <div className="flex items-center gap-2 text-neutral-500">
              <Icon size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{rotulo}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{valor}</p>
          </div>
        ))}
      </div>

      {/* E-mails mais usados */}
      {emailsPorUso.length > 0 && (
        <div className="surface-panel mb-6 rounded-[22px] border border-white/[0.07] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Mail size={16} className="text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">E-mails de login mais usados</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {emailsPorUso.map(([email, usos]) => (
              <button
                key={email}
                type="button"
                onClick={() => setBusca(email)}
                title="Filtrar projetos que usam este e-mail"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-300 transition hover:border-emerald-400/30 hover:text-white"
              >
                {email}
                <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  {usos} {usos === 1 ? 'uso' : 'usos'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600" size={16} />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar projeto, e-mail, repo, endpoint..."
            className="h-11 w-full rounded-xl border border-white/[0.075] bg-white/[0.025] pl-10 pr-4 text-xs text-neutral-200 outline-none transition placeholder:text-neutral-700 focus:border-emerald-400/25"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFiltroPlataforma('todas')}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
              filtroPlataforma === 'todas'
                ? 'bg-emerald-300 text-[#07110c]'
                : 'border border-white/[0.08] text-neutral-500 hover:text-white'
            }`}
          >
            Todas
          </button>
          {plataformasPresentes.map((pl) => (
            <button
              key={pl}
              type="button"
              onClick={() => setFiltroPlataforma(filtroPlataforma === pl ? 'todas' : pl)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                filtroPlataforma === pl
                  ? 'bg-emerald-300 text-[#07110c]'
                  : 'border border-white/[0.08] text-neutral-500 hover:text-white'
              }`}
            >
              {PLATAFORMA_LABEL[pl]}
            </button>
          ))}
        </div>
      </div>

      {/* Projetos */}
      {projetosFiltrados.length === 0 ? (
        <div className="surface-panel rounded-[22px] border border-white/[0.07] px-6 py-14 text-center">
          <Server className="mx-auto text-neutral-700" size={26} />
          <p className="mt-3 text-sm font-medium text-neutral-300">Nada por aqui ainda</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-neutral-600">
            {stats.comInfra === 0
              ? 'Nenhum projeto tem contas de plataforma ou endpoints registrados. Edite um projeto (aba Infra & Contas) ou envie os dados pelo endpoint de integração.'
              : 'Nenhum projeto corresponde ao filtro atual.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projetosFiltrados.map((projeto: Project) => (
            <article
              key={projeto.id}
              className="surface-panel flex flex-col rounded-[22px] border border-white/[0.07] p-5 transition hover:border-white/[0.14]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-white">{projeto.name}</h3>
                  {projeto.ownerEmail && (
                    <p className="mt-0.5 truncate text-[11px] text-neutral-500">{projeto.ownerEmail}</p>
                  )}
                  {projeto.stack && <p className="mt-1 truncate text-[10px] text-neutral-600">{projeto.stack}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProject(projeto.id)}
                  className="shrink-0 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] font-semibold text-neutral-400 transition hover:border-emerald-400/30 hover:text-emerald-300"
                >
                  Detalhes
                </button>
              </div>

              <div className="mt-3 space-y-1.5 text-[11px]">
                {projeto.repo && (
                  <a
                    href={`https://github.com/${projeto.repo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-neutral-400 transition hover:text-emerald-300"
                  >
                    <FolderKanban size={12} />
                    <span className="truncate">{projeto.repo}</span>
                    <ExternalLink size={10} className="opacity-60" />
                  </a>
                )}
                {projeto.deployUrl && (
                  <a
                    href={projeto.deployUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-neutral-400 transition hover:text-emerald-300"
                  >
                    <ArrowUpRight size={12} />
                    <span className="truncate">{projeto.deployUrl}</span>
                  </a>
                )}
              </div>

              {(projeto.platforms ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(projeto.platforms ?? []).map((pl) => (
                    <span
                      key={pl.id}
                      title={`${PLATAFORMA_LABEL[pl.platform]} — ${pl.email}${pl.projectName ? ` (${pl.projectName})` : ''}`}
                      className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] text-neutral-300"
                    >
                      <Server size={10} className="text-emerald-300/70" />
                      {PLATAFORMA_LABEL[pl.platform]}
                      <span className="text-neutral-600">·</span>
                      <span className="max-w-[110px] truncate">{pl.email}</span>
                    </span>
                  ))}
                </div>
              )}

              {(projeto.endpoints ?? []).length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-3">
                  {(projeto.endpoints ?? []).slice(0, 3).map((ep) => (
                    <li key={ep.id} className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                      <Link2 size={10} className="shrink-0 text-neutral-600" />
                      <span className="shrink-0 font-medium text-neutral-400">{ep.label}:</span>
                      <span className="truncate">{ep.url}</span>
                    </li>
                  ))}
                  {(projeto.endpoints ?? []).length > 3 && (
                    <li className="text-[10px] text-neutral-600">+{(projeto.endpoints ?? []).length - 3} outros</li>
                  )}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default InfraHub;
