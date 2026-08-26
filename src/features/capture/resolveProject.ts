export interface ResolvableProject {
  id: string;
  name: string;
  aliases?: string[];
  vocab?: string[];
}

export interface Candidate {
  projectId: string;
  score: number;
}

export type ResolutionStatus = 'resolved' | 'ambiguous' | 'unknown';

export interface Resolution {
  status: ResolutionStatus;
  /** Preenchido apenas quando status === 'resolved'. */
  projectId?: string;
  /** 0..1 — o quanto o primeiro colocado se separou do segundo. */
  confidence: number;
  /** Ordenado por score decrescente. Vazio quando status === 'unknown'. */
  candidates: Candidate[];
}

/** Peso de um apelido casado, multiplicado pelo número de palavras dele. */
const ALIAS_WEIGHT = 10;
/** Peso de cada termo distinto de vocabulário casado. */
const VOCAB_WEIGHT = 3;
/**
 * Abaixo disso o segundo colocado está perto demais do primeiro
 * para chutar um vencedor.
 */
const AMBIGUITY_THRESHOLD = 0.34;
/** Palavras derivadas menores que isso viram ruído ("ai" casa com "aí"). */
const MIN_DERIVED_TOKEN = 3;

/** Minúsculas, sem acento, espaços colapsados. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Casa apenas em fronteira de palavra: "talk" não casa dentro de "talkshow". */
function containsTerm(haystack: string, term: string): boolean {
  if (!term) return false;
  return new RegExp(`(?:^|\\W)${escapeRegex(term)}(?:\\W|$)`).test(haystack);
}

/**
 * Apelidos deduzidos do nome do projeto, para quem ainda não cadastrou
 * nenhum à mão. "Mavo Talk" → ["mavo talk", "mavotalk", "mavo", "talk"].
 */
export function deriveAliases(name: string): string[] {
  const full = normalize(name);
  if (!full) return [];

  const derived = new Set<string>([full]);

  const words = full.split(' ').filter(Boolean);
  if (words.length > 1) {
    derived.add(words.join(''));
    for (const word of words) {
      if (word.length >= MIN_DERIVED_TOKEN) derived.add(word);
    }
  }

  return [...derived];
}

function aliasesFor(project: ResolvableProject): string[] {
  const declared = (project.aliases ?? []).map(normalize).filter(Boolean);
  return [...new Set([...deriveAliases(project.name), ...declared])];
}

function scoreProject(haystack: string, project: ResolvableProject): number {
  // Apelido: vale o MELHOR casamento, não a soma — senão "mavo talk"
  // somaria com "mavo" e inflaria o placar sem ganhar informação.
  let bestAlias = 0;
  for (const alias of aliasesFor(project)) {
    if (!containsTerm(haystack, alias)) continue;
    const weight = alias.split(' ').length * ALIAS_WEIGHT;
    if (weight > bestAlias) bestAlias = weight;
  }

  // Vocabulário: soma, porque cada termo distinto é evidência independente.
  let vocabScore = 0;
  for (const term of new Set((project.vocab ?? []).map(normalize))) {
    if (containsTerm(haystack, term)) vocabScore += VOCAB_WEIGHT;
  }

  return bestAlias + vocabScore;
}

/**
 * Descobre de qual projeto o texto está falando, usando apelidos e
 * vocabulário de domínio. Puro: sem rede, sem chave de API.
 *
 * Quando devolve 'ambiguous', quem chama deve perguntar ao usuário —
 * chutar entre dois candidatos empatados erra metade das vezes.
 */
export function resolveProject(
  text: string,
  projects: ResolvableProject[]
): Resolution {
  const haystack = normalize(text);

  const candidates = projects
    .map((p) => ({ projectId: p.id, score: scoreProject(haystack, p) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return { status: 'unknown', confidence: 0, candidates: [] };
  }

  const top = candidates[0].score;
  const second = candidates[1]?.score ?? 0;
  const confidence = (top - second) / top;

  if (confidence < AMBIGUITY_THRESHOLD) {
    const empatados = candidates.filter(
      (c) => (top - c.score) / top < AMBIGUITY_THRESHOLD
    );
    return { status: 'ambiguous', confidence, candidates: empatados };
  }

  return {
    status: 'resolved',
    projectId: candidates[0].projectId,
    confidence,
    candidates,
  };
}
