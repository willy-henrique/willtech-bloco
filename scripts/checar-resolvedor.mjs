/**
 * Passa frases reais pelo resolvedor usando o catálogo gerado, para ver
 * se ele acerta o projeto antes de importar qualquer coisa no Firestore.
 *
 * Use isto ao afinar `vocab`: rode, veja o que erra, ajuste o vocabulário
 * no OVERRIDES do gerador (ou direto no painel) e rode de novo.
 *
 * Uso: node scripts/checar-resolvedor.mjs ["frase própria" ...]
 */
import { readFileSync } from 'node:fs';
import { resolveProject } from '../src/features/capture/resolveProject.ts';

const SEED = 'src/features/projects/catalogo.seed.ts';

const bruto = readFileSync(SEED, 'utf8');
const catalogo = JSON.parse(
  bruto.slice(bruto.indexOf('= [') + 2, bruto.lastIndexOf(']') + 1)
);

const projetos = catalogo.map((p, i) => ({
  id: String(i),
  name: p.name,
  aliases: p.aliases,
  vocab: p.vocab,
}));

const nomeDe = (id) => projetos.find((p) => p.id === id)?.name ?? id;

const FRASES_PADRAO = [
  'a sessao do whats caiu de novo',
  'o pareamento do whatsapp ta falhando',
  'arrumar a comanda do pesqueiro',
  'o relatorio do gerenciamento ta quebrado',
  'o cliente do barbeiro nao consegue agendar',
  'problema no asaas do clube',
  'mavo ta lento',
  'o fallback da resposta ta errado',
  'atualizar o boleto no erp',
  'o prestador nao recebe o pedido',
  'comprar cafe na padaria',
];

const frases = process.argv.slice(2).length ? process.argv.slice(2) : FRASES_PADRAO;

let resolvidas = 0;
let ambiguas = 0;
let desconhecidas = 0;

for (const frase of frases) {
  const r = resolveProject(frase, projetos);

  let veredito;
  if (r.status === 'resolved') {
    resolvidas++;
    veredito = `→ ${nomeDe(r.projectId)}`;
  } else if (r.status === 'ambiguous') {
    ambiguas++;
    veredito = `? pergunta: ${r.candidates.map((c) => nomeDe(c.projectId)).join(' | ')}`;
  } else {
    desconhecidas++;
    veredito = '∅ nao reconheceu';
  }

  console.log(`"${frase}"`);
  console.log(`   ${veredito}   (confianca ${r.confidence.toFixed(2)})\n`);
}

console.log(
  `${projetos.length} projetos no catalogo | ` +
  `${resolvidas} resolvidas, ${ambiguas} perguntam, ${desconhecidas} desconhecidas`
);
