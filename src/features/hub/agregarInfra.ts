import type { Project } from '../../../types';
import type { PlatformName } from '../../../types';

export interface ContaAgregada {
  platform: PlatformName;
  email: string;
  projetos: Array<{ id: string; name: string }>;
}

export interface EstatisticasInfra {
  projetos: number;
  comInfra: number;
  contas: number;
  emailsUnicos: number;
  endpoints: number;
}

/** Agrupa as contas por (plataforma, email) mostrando quais projetos usam cada uma. */
export function agregarContas(projects: Project[]): ContaAgregada[] {
  const mapa = new Map<string, ContaAgregada>();
  for (const projeto of projects) {
    for (const conta of projeto.platforms ?? []) {
      if (!conta.email) continue;
      const chave = `${conta.platform}\u0000${conta.email.trim().toLowerCase()}`;
      const existente = mapa.get(chave);
      if (existente) {
        if (!existente.projetos.some((p) => p.id === projeto.id)) {
          existente.projetos.push({ id: projeto.id, name: projeto.name });
        }
      } else {
        mapa.set(chave, {
          platform: conta.platform,
          email: conta.email.trim(),
          projetos: [{ id: projeto.id, name: projeto.name }],
        });
      }
    }
  }
  return [...mapa.values()].sort(
    (a, b) => a.platform.localeCompare(b.platform) || a.email.localeCompare(b.email),
  );
}

export function estatisticasInfra(projects: Project[]): EstatisticasInfra {
  const contas = agregarContas(projects);
  return {
    projetos: projects.length,
    comInfra: projects.filter((p) => (p.platforms ?? []).length > 0 || (p.endpoints ?? []).length > 0).length,
    contas: contas.length,
    emailsUnicos: new Set(contas.map((c) => c.email.toLowerCase())).size,
    endpoints: projects.reduce((soma, p) => soma + (p.endpoints ?? []).length, 0),
  };
}
