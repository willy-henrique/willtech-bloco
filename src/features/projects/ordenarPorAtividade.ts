import type { Project } from '../../../types';

/** Commits nos últimos 30 dias: evoluções + correções. */
export function atividadeDe(projeto: Project): number {
  return (projeto.evolucoes30d ?? 0) + (projeto.correcoes30d ?? 0);
}

/**
 * Um projeto criado à mão, que nunca passou pela importação. Precisa checar
 * os três campos: um projeto pode ter contagem de atividade sem a data do
 * último commit, e nesse caso ainda tem informação suficiente para ordenar.
 */
const semDadoDeCommit = (p: Project) =>
  !p.ultimoCommit && !p.evolucoes30d && !p.correcoes30d;

/**
 * Ordena os cards pelo que está mais quente: quem teve mais commits nos
 * últimos 30 dias sobe. Empate desempata pelo commit mais recente.
 *
 * Projetos criados à mão, sem nenhum dado de commit, vão para o fim em
 * ordem alfabética — assim a lista não fica dançando a cada render, que
 * é o que aconteceria se ficassem todos empatados em zero.
 *
 * Não modifica a lista recebida.
 */
export function ordenarPorAtividade(projetos: Project[]): Project[] {
  return [...projetos].sort((a, b) => {
    const aVazio = semDadoDeCommit(a);
    const bVazio = semDadoDeCommit(b);

    if (aVazio && bVazio) return a.name.localeCompare(b.name, 'pt-BR');
    if (aVazio) return 1;
    if (bVazio) return -1;

    const diferenca = atividadeDe(b) - atividadeDe(a);
    if (diferenca !== 0) return diferenca;

    return (b.ultimoCommit ?? '').localeCompare(a.ultimoCommit ?? '');
  });
}
