import type { Project } from '../../../types';
import type { CatalogoProjeto } from './tipos';

/** Quantos dias sem commit tiram o projeto do recorte da importação. */
const JANELA_DIAS = 30;

export interface AtualizacaoPlanejada {
  existente: Project;
  doCatalogo: CatalogoProjeto;
  /** Só os campos que realmente mudam — nunca inclui o que o usuário definiu. */
  patch: Partial<Project>;
  /** Descrição em português, para a tela de confirmação. */
  mudancas: string[];
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

/**
 * Casa um projeto do catálogo com um que já existe no painel. Compara pelo
 * nome e também pelos apelidos — no painel pode estar "WillTalk" enquanto o
 * catálogo chama de "Mavo Talk", e são o mesmo projeto.
 */
function acharExistente(doCatalogo: CatalogoProjeto, existentes: Project[]): Project | undefined {
  const nomeCatalogo = normalizar(doCatalogo.name);
  const apelidos = new Set(doCatalogo.aliases.map(normalizar));

  return existentes.find((e) => {
    const nome = normalizar(e.name);
    return nome === nomeCatalogo || apelidos.has(nome);
  });
}

/**
 * Decide o que criar e o que enriquecer, sem NUNCA remover nada.
 *
 * O que o usuário definiu à mão é intocável: nome, cor, progresso e status
 * ficam como estão. Apelidos e vocabulário são somados aos existentes, não
 * substituídos. Stack e repo só são preenchidos quando estão vazios.
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

  for (const item of catalogo) {
    if (item.ultimoCommit < dataCorte) {
      plano.foraDoRecorte.push({
        nome: item.name,
        motivo: `sem commit desde ${item.ultimoCommit}`,
      });
      continue;
    }

    const existente = acharExistente(item, existentes);
    if (!existente) {
      plano.criar.push(item);
      continue;
    }

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

    if (mudancas.length === 0) {
      plano.semMudanca.push(existente);
    } else {
      plano.atualizar.push({ existente, doCatalogo: item, patch, mudancas });
    }
  }

  return plano;
}
