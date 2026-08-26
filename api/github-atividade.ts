import { buscarAtividade } from './_atividade';

/** Teto de repositórios por chamada, para a função não estourar o tempo. */
const MAX_REPOS = 30;

interface Req {
  method?: string;
  body?: unknown;
}

interface Res {
  status: (codigo: number) => Res;
  json: (corpo: unknown) => void;
}

/**
 * POST /api/github-atividade  { repos: ["owner/repo", ...] }
 *
 * O token vive só aqui, em variável de ambiente do servidor. Ele nunca é
 * devolvido na resposta nem chega ao navegador — é justamente por isso que
 * esta função existe, em vez de o painel chamar a API do GitHub direto.
 */
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Use POST.' });
    return;
  }

  const corpo = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
    repos?: unknown;
  };

  const repos = Array.isArray(corpo?.repos)
    ? corpo.repos.filter((r): r is string => typeof r === 'string' && r.includes('/'))
    : [];

  if (repos.length === 0) {
    res.status(400).json({ erro: 'Envie { repos: ["owner/repo", ...] }.' });
    return;
  }

  if (repos.length > MAX_REPOS) {
    res.status(400).json({ erro: `No máximo ${MAX_REPOS} repositórios por chamada.` });
    return;
  }

  const resultados = await buscarAtividade(repos, process.env.GITHUB_TOKEN);

  res.status(200).json({
    resultados,
    // Diz ao painel se dá para explicar um 404 como "faltou token".
    comToken: Boolean(process.env.GITHUB_TOKEN),
  });
}
