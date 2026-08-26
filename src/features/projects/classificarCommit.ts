export type TipoDeCommit = 'evoluiu' | 'corrigiu' | 'melhorou' | 'manutencao' | 'outro';

/**
 * Traduz o prefixo do Conventional Commits para o que ele significa no
 * painel. Quem lê o painel quer saber se o projeto ANDOU ou se estava
 * apagando incêndio — não se o prefixo era `perf` ou `refactor`.
 */
const REGRAS: Array<{ re: RegExp; tipo: TipoDeCommit }> = [
  { re: /^feat/i, tipo: 'evoluiu' },
  { re: /^fix|^hotfix/i, tipo: 'corrigiu' },
  { re: /^refactor|^perf|^style/i, tipo: 'melhorou' },
  { re: /^docs|^chore|^build|^ci|^test/i, tipo: 'manutencao' },
];

export function classificarCommit(assunto: string): TipoDeCommit {
  for (const { re, tipo } of REGRAS) if (re.test(assunto)) return tipo;
  return 'outro';
}

/** Tira o prefixo "feat(escopo):" e deixa só o que aconteceu. */
export function semPrefixo(assunto: string): string {
  return assunto.replace(/^\s*\w+(\([^)]*\))?!?:\s*/, '').trim();
}

/**
 * Parte dos commits foi gravada em UTF-8 e lida como latin-1, virando
 * "validaÃ§Ã£o". Sem reparar, o vocabulário e o histórico saem com lixo.
 */
const MOJIBAKE = /[ÃÂ][-¿]/;

export function repararEncoding(texto: string): string {
  if (!MOJIBAKE.test(texto)) return texto;
  try {
    // TextDecoder em vez de Buffer: este modulo e importado tanto pela
    // funcao serverless quanto pelo bundle do navegador, e Buffer nao
    // existe no navegador.
    const bytes = Uint8Array.from(texto, (c) => c.charCodeAt(0) & 0xff);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return texto;
  }
}

/** Só a primeira linha da mensagem de commit importa para o painel. */
export function primeiraLinha(mensagem: string): string {
  return mensagem.split('\n')[0].trim();
}
