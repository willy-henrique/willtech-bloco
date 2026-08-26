import {
  classificarCommit,
  semPrefixo,
  repararEncoding,
  primeiraLinha,
} from '../src/features/projects/classificarCommit';
import type { EventoDeCommit } from '../src/features/projects/tipos';

/** Janela de atividade considerada, em dias. */
const JANELA_DIAS = 30;
/** Quantos commits guardar no histórico de cada projeto. */
const COMMITS_NO_HISTORICO = 20;

export interface AtividadeDoRepo {
  /** "owner/repo" */
  repo: string;
  ok: boolean;
  /** Preenchido quando ok === false. Texto pronto para mostrar ao usuário. */
  erro?: string;
  ultimoCommit?: string;
  evolucoes30d?: number;
  correcoes30d?: number;
  historico?: EventoDeCommit[];
}

interface CommitDaApi {
  sha: string;
  commit: { message: string; committer?: { date?: string } };
}

function mensagemDeErro(status: number, repo: string): string {
  switch (status) {
    case 401:
      return 'Token do GitHub inválido ou expirado.';
    case 403:
      return 'Limite da API do GitHub atingido. Configure GITHUB_TOKEN para elevar o limite.';
    case 404:
      return `Repositório ${repo} é privado ou não existe. Um token com escopo "repo" é necessário.`;
    case 409:
      return `Repositório ${repo} está vazio.`;
    default:
      return `GitHub respondeu ${status} para ${repo}.`;
  }
}

/**
 * Busca a atividade recente de um repositório no GitHub.
 *
 * Nunca lança: um repositório que falha devolve `ok: false` com o motivo,
 * para que uma falha isolada não derrube o lote inteiro. Repositório
 * privado sem token é o caso mais comum, e o erro precisa dizer isso em
 * vez de "404".
 */
export async function buscarAtividadeDoRepo(
  repo: string,
  token?: string
): Promise<AtividadeDoRepo> {
  const desde = new Date();
  desde.setDate(desde.getDate() - JANELA_DIAS);

  const url =
    `https://api.github.com/repos/${repo}/commits` +
    `?since=${desde.toISOString()}&per_page=100`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'willtech-bloco',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, { headers });
  } catch {
    return { repo, ok: false, erro: 'Não foi possível alcançar a API do GitHub.' };
  }

  if (!resposta.ok) {
    return { repo, ok: false, erro: mensagemDeErro(resposta.status, repo) };
  }

  const commits = (await resposta.json()) as CommitDaApi[];

  // A janela de 30 dias pode não conter nenhum commit — o projeto existe,
  // só está parado. Isso é informação, não erro.
  if (!Array.isArray(commits) || commits.length === 0) {
    return { repo, ok: true, evolucoes30d: 0, correcoes30d: 0, historico: [] };
  }

  const eventos: EventoDeCommit[] = commits.map((c) => {
    const assunto = repararEncoding(primeiraLinha(c.commit.message));
    return {
      data: (c.commit.committer?.date ?? '').slice(0, 10),
      tipo: classificarCommit(assunto),
      assunto: semPrefixo(assunto),
    };
  });

  return {
    repo,
    ok: true,
    ultimoCommit: eventos[0].data,
    evolucoes30d: eventos.filter((e) => e.tipo === 'evoluiu').length,
    correcoes30d: eventos.filter((e) => e.tipo === 'corrigiu').length,
    historico: eventos.slice(0, COMMITS_NO_HISTORICO),
  };
}

/**
 * Busca vários repositórios. As chamadas são sequenciais de propósito:
 * o GitHub responde 403 com secondary rate limit quando recebe muitas
 * requisições em paralelo da mesma origem, e são poucos repositórios.
 */
export async function buscarAtividade(
  repos: string[],
  token?: string
): Promise<AtividadeDoRepo[]> {
  const resultados: AtividadeDoRepo[] = [];
  for (const repo of repos) {
    resultados.push(await buscarAtividadeDoRepo(repo, token));
  }
  return resultados;
}
