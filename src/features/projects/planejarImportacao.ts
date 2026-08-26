import type { Project } from '../../../types';
import type { CatalogoProjeto } from './tipos';

/** Quantos dias sem commit tiram o projeto do recorte da importação. */
const JANELA_DIAS = 30;

/**
 * Tamanho mínimo de um apelido para valer casamento por trecho.
 * "agrorafia" dentro de "projeto do jeferson agrorafia" é sinal forte;
 * "chat" dentro de "Chat do Cliente" é coincidência.
 */
const MIN_APELIDO_PARA_TRECHO = 6;

export interface AtualizacaoPlanejada {
  existente: Project;
  doCatalogo: CatalogoProjeto;
  /** Só os campos que realmente mudam — nunca inclui o que o usuário definiu. */
  patch: Partial<Project>;
  /** Descrição em português, para a tela de confirmação. */
  mudancas: string[];
  /** Como o casamento aconteceu, para a tela deixar transparente. */
  casamento: 'exato' | 'trecho';
}

export interface PlanoImportacao {
  criar: CatalogoProjeto[];
  atualizar: AtualizacaoPlanejada[];
  /** Já está no painel e não tem nada a acrescentar. */
  semMudanca: Project[];
  foraDoRecorte: Array<{ nome: string; motivo: string }>;
}

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const uniao = (a: string[] = [], b: string[] = []) => [...new Set([...a, ...b])];

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Casa só em fronteira de palavra, para "erp" não casar dentro de "superp". */
const contemTermo = (texto: string, termo: string) =>
  new RegExp(`(?:^|\\W)${escaparRegex(termo)}(?:\\W|$)`).test(texto);

interface Casamento {
  projeto: Project;
  tipo: 'exato' | 'trecho';
}

/**
 * Casa um projeto do catálogo com um que já existe no painel.
 *
 * Duas formas, nesta ordem de preferência:
 *   exato  — o nome cadastrado é igual ao nome ou a um apelido do catálogo
 *   trecho — um apelido longo aparece como palavra inteira dentro do nome
 *            cadastrado ("agrorafia" em "projeto do jeferson agrorafia")
 *
 * Cards já reivindicados por outro item do catálogo são pulados, senão dois
 * projetos parecidos disputariam o mesmo card e um sobrescreveria o outro.
 */
function acharExistente(
  doCatalogo: CatalogoProjeto,
  existentes: Project[],
  reivindicados: Set<string>
): Casamento | undefined {
  const nomeCatalogo = normalizar(doCatalogo.name);
  const apelidos = doCatalogo.aliases.map(normalizar);
  const conjunto = new Set([...apelidos, nomeCatalogo]);

  const livres = existentes.filter((e) => !reivindicados.has(e.id));

  const exato = livres.find((e) => conjunto.has(normalizar(e.name)));
  if (exato) return { projeto: exato, tipo: 'exato' };

  const longos = [...conjunto].filter((a) => a.length >= MIN_APELIDO_PARA_TRECHO);
  const porTrecho = livres.find((e) => {
    const nome = normalizar(e.name);
    return longos.some((a) => contemTermo(nome, a));
  });
  if (porTrecho) return { projeto: porTrecho, tipo: 'trecho' };

  return undefined;
}

/**
 * Decide o que criar e o que enriquecer, sem NUNCA remover nada.
 *
 * O que o usuário definiu à mão é intocável: nome, cor, progresso e status
 * ficam como estão. Apelidos e vocabulário são somados aos existentes, não
 * substituídos. Stack e repo só são preenchidos quando estão vazios.
 *
 * A atividade (últimos commits) é a exceção: é derivada do repositório, não
 * escrita por ninguém, então é sempre sobrescrita com o valor mais novo.
 */
export function planejarImportacao(
  catalogo: CatalogoProjeto[],
  existentes: Project[],
  hoje: Date = new Date()
): PlanoImportacao {
  const corte = new Date(hoje);
  corte.setDate(corte.getDate() - JANELA_DIAS);
  const dataCorte = corte.toISOString().slice(0, 10);

  const plano: PlanoImportacao = {
    criar: [],
    atualizar: [],
    semMudanca: [],
    foraDoRecorte: [],
  };

  const reivindicados = new Set<string>();

  // Casamento exato tem prioridade sobre casamento por trecho, então os
  // itens que casam exato precisam escolher primeiro.
  const porPrioridade = [...catalogo].sort((a, b) => {
    const exato = (item: CatalogoProjeto) =>
      existentes.some((e) =>
        [normalizar(item.name), ...item.aliases.map(normalizar)].includes(normalizar(e.name))
      )
        ? 0
        : 1;
    return exato(a) - exato(b);
  });

  for (const item of porPrioridade) {
    if (item.ultimoCommit < dataCorte) {
      plano.foraDoRecorte.push({
        nome: item.name,
        motivo: `sem commit desde ${item.ultimoCommit}`,
      });
      continue;
    }

    const casamento = acharExistente(item, existentes, reivindicados);
    if (!casamento) {
      plano.criar.push(item);
      continue;
    }

    const existente = casamento.projeto;
    reivindicados.add(existente.id);

    const patch: Partial<Project> = {};
    const mudancas: string[] = [];

    const aliases = uniao(existente.aliases, item.aliases);
    if (aliases.length > (existente.aliases?.length ?? 0)) {
      patch.aliases = aliases;
      mudancas.push(`+${aliases.length - (existente.aliases?.length ?? 0)} apelidos`);
    }

    const vocab = uniao(existente.vocab, item.vocab);
    if (vocab.length > (existente.vocab?.length ?? 0)) {
      patch.vocab = vocab;
      mudancas.push(`+${vocab.length - (existente.vocab?.length ?? 0)} termos de vocabulário`);
    }

    if (!existente.stack && item.stack && item.stack !== 'Indefinida') {
      patch.stack = item.stack;
      mudancas.push(`stack: ${item.stack}`);
    }

    if (!existente.repo && item.repo) {
      patch.repo = item.repo;
      mudancas.push(`repositório: ${item.repo}`);
    }

    const atividadeMudou =
      existente.ultimoCommit !== item.ultimoCommit ||
      existente.evolucoes30d !== item.evolucoes30d ||
      existente.correcoes30d !== item.correcoes30d;

    if (atividadeMudou) {
      patch.ultimoCommit = item.ultimoCommit;
      patch.evolucoes30d = item.evolucoes30d;
      patch.correcoes30d = item.correcoes30d;
      patch.historico = item.historico;
      mudancas.push(`atividade: ${item.evolucoes30d} evoluções, ${item.correcoes30d} correções`);
    }

    if (mudancas.length === 0) {
      plano.semMudanca.push(existente);
    } else {
      plano.atualizar.push({
        existente,
        doCatalogo: item,
        patch,
        mudancas,
        casamento: casamento.tipo,
      });
    }
  }

  return plano;
}
