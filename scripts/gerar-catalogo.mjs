/**
 * Varre os repositórios git em C:\willydev e monta o catálogo de projetos:
 * nome, stack, apelidos, vocabulário de domínio e o histórico do que evoluiu.
 *
 * O vocabulário e o histórico saem das mensagens de commit — são exatamente
 * as palavras que o dono usa para falar de cada projeto, que é o que o
 * resolvedor da captura precisa para reconhecer o projeto sem citar o nome.
 *
 * Uso:  node scripts/gerar-catalogo.mjs [--raiz C:/willydev] [--meses 6]
 * Saída: src/features/projects/catalogo.seed.ts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const args = process.argv.slice(2);
const opt = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : padrao;
};

const RAIZ = opt('raiz', 'C:/willydev');
const MESES = Number(opt('meses', '6'));
const SAIDA = 'src/features/projects/catalogo.seed.ts';
const COMMITS_ANALISADOS = 120;
const COMMITS_NO_HISTORICO = 20;
const MAX_VOCAB = 14;

/**
 * O gerador acerta a stack e o vocabulário, mas não sabe como você CHAMA
 * cada projeto — o nome da pasta raramente é o nome de verdade. Corrija
 * aqui; é o único trecho deste arquivo feito para ser editado à mão.
 *
 *   nome     → como aparece no painel e como o bot te responde
 *   aliases  → apelidos EXTRA (os derivados do nome continuam valendo)
 *   ignorar  → repositório duplicado ou que não deve virar projeto
 */
const OVERRIDES = {
  'willtalk': { nome: 'Mavo Talk', aliases: ['talk', 'mavo talk', 'mavotalk'] },
  'chat-inteligente': { nome: 'Mavo AI', aliases: ['mavo ai', 'mavoai', 'mavo ia'] },
  'mavo-gerenciamento': { nome: 'Mavo Gerenciamento', aliases: ['gerenciamento', 'metricas'] },
  'ar': { nome: 'AquiResolve App', aliases: ['aqui resolve', 'app do aqui resolve'] },
  'AquiResolve': { nome: 'AquiResolve Site', aliases: ['site do aqui resolve', 'landing'] },
  'dashboard_admin-1': { nome: 'AquiResolve Painel', aliases: ['painel do aqui resolve'] },
  'WillTech-ERP': { nome: 'WillTech ERP', aliases: ['erp', 'agro rafia', 'agrorafia'] },
  'sistema-pesquepague': { nome: 'WillTech Pesqueiros', aliases: ['pesqueiro', 'pesque e pague'] },
  'escola-gestao': { nome: 'Escola Estrelinha', aliases: ['escola', 'estrelinha'] },
  'apagarconta-dashboardamin': { nome: 'Exclusão de Conta', aliases: ['exclusao de conta'] },
  'lang-page-willy': { nome: 'Portfólio Willy', aliases: ['portfolio', 'landing page'] },
  'willtech-bloco': { nome: 'WillTech Bloco', aliases: ['bloco', 'painel', 'command dashboard'] },

  // Duplicatas: mesmo remote de outro repositório já listado.
  'mavotalk-local': { ignorar: 'cópia local do willtalk' },
  'APLICATIVO-COMPLETO': { ignorar: 'mesmo remote do repositório "ar"' },
};

/** Ruído: prefixos de commit, termos de git e palavras vazias do português. */
const STOPWORDS = new Set([
  'feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'tests', 'style', 'perf',
  'build', 'revert', 'merge', 'branch', 'commit', 'initial', 'update', 'updates',
  'wip', 'hotfix', 'release', 'bump', 'lint',
  'para', 'com', 'que', 'dos', 'das', 'uma', 'uns', 'mais', 'nao', 'sem', 'por',
  'pelo', 'pela', 'nos', 'nas', 'aos', 'ate', 'como', 'quando', 'onde', 'isso',
  'esse', 'essa', 'este', 'esta', 'seu', 'sua', 'seus', 'suas', 'mas', 'ele',
  'ela', 'foi', 'era', 'sao', 'ser', 'tem', 'ter', 'faz', 'fazer', 'usar',
  'novo', 'nova', 'novos', 'novas', 'todo', 'toda', 'todos', 'todas', 'agora',
  'depois', 'antes', 'ainda', 'entre', 'sobre', 'apos', 'cada', 'outro', 'outra',
  'adiciona', 'adicionar', 'corrige', 'corrigir', 'remove', 'remover', 'ajusta',
  'ajustar', 'melhora', 'melhorar', 'implementa', 'implementar', 'atualiza',
  'atualizar', 'cria', 'criar', 'move', 'mover', 'troca', 'trocar', 'aplica',
  'refatora', 'refatorar', 'organiza', 'renomeia', 'muda', 'mudar', 'deixa',
  'codigo', 'arquivo', 'arquivos', 'pasta', 'projeto', 'sistema', 'versao',
  'erro', 'erros', 'bugs', 'problema', 'ajuste', 'ajustes', 'melhorias',
  'funcao', 'funcoes', 'pagina', 'paginas', 'tela', 'telas', 'campo', 'campos',
  'botao', 'botoes', 'texto', 'dados', 'lista', 'item', 'itens', 'valor',
  'apenas', 'opcionais', 'tratamento', 'permitir', 'registrar', 'undefined',
]);

/**
 * Parte dos commits foi gravada em UTF-8 e lida como latin-1, virando
 * "validaÃ§Ã£o". Sem reparar, o minerador extrai lixo tipo "validaa".
 */
const MOJIBAKE = /[\u00c3\u00c2][\u0080-\u00bf]/;

function repararEncoding(texto) {
  if (!MOJIBAKE.test(texto)) return texto;
  try {
    return Buffer.from(texto, 'latin1').toString('utf8');
  } catch {
    return texto;
  }
}

const semAcento = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function git(dir, ...cmd) {
  try {
    return execFileSync('git', ['-C', dir, ...cmd], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 8 * 1024 * 1024,
    }).trim();
  } catch {
    return '';
  }
}

function lerJson(caminho) {
  try {
    return JSON.parse(readFileSync(caminho, 'utf8'));
  } catch {
    return null;
  }
}

function detectarStack(dir) {
  const pkg = lerJson(join(dir, 'package.json'));
  const partes = [];

  if (pkg) {
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const tem = (n) => Object.prototype.hasOwnProperty.call(deps, n);

    if (tem('next')) partes.push('Next.js');
    else if (tem('react')) partes.push('React');
    else if (tem('vue')) partes.push('Vue');
    else if (tem('svelte')) partes.push('Svelte');

    if (tem('firebase') || tem('firebase-admin')) partes.push('Firebase');
    if (tem('@supabase/supabase-js')) partes.push('Supabase');
    if (tem('@prisma/client') || tem('prisma')) partes.push('Prisma');
    if (tem('pg') || tem('postgres')) partes.push('PostgreSQL');
    if (tem('express')) partes.push('Express');
    if (tem('tailwindcss')) partes.push('Tailwind');
  }

  if (existsSync(join(dir, 'composer.json'))) partes.push('PHP');
  if (existsSync(join(dir, 'requirements.txt')) || existsSync(join(dir, 'pyproject.toml')))
    partes.push('Python');

  return partes.join(' + ') || 'Indefinida';
}

/** Traduz o prefixo do commit para o que ele significa no painel. */
const TIPOS = [
  { re: /^feat/i, tipo: 'evoluiu' },
  { re: /^fix|^hotfix/i, tipo: 'corrigiu' },
  { re: /^refactor|^perf|^style/i, tipo: 'melhorou' },
  { re: /^docs|^chore|^build|^ci|^test/i, tipo: 'manutencao' },
];

function classificar(assunto) {
  for (const { re, tipo } of TIPOS) if (re.test(assunto)) return tipo;
  return 'outro';
}

/** Tira o prefixo "feat(escopo):" e deixa só o que aconteceu. */
const semPrefixo = (assunto) => assunto.replace(/^\s*\w+(\([^)]*\))?!?:\s*/, '').trim();

function lerCommits(dir) {
  const bruto = git(dir, 'log', `-${COMMITS_ANALISADOS}`, '--format=%cI\u0001%s');
  if (!bruto) return [];

  return bruto.split('\n').map((linha) => {
    const [data, ...resto] = linha.split('\u0001');
    const assunto = repararEncoding(resto.join('\u0001'));
    return {
      data: (data ?? '').slice(0, 10),
      tipo: classificar(assunto),
      assunto: semPrefixo(assunto),
    };
  });
}

/**
 * Vocabulário: palavras frequentes nos commits, tirando ruído. Uma palavra
 * só entra se aparecer em pelo menos dois commits — termo que apareceu
 * uma vez sozinho costuma ser acidente, não domínio.
 */
function minerarVocabulario(commits) {
  const frequencia = new Map();

  for (const { assunto } of commits) {
    const vistas = new Set();
    for (const palavra of semAcento(assunto).match(/[a-z][a-z0-9]{3,}/g) ?? []) {
      if (STOPWORDS.has(palavra) || vistas.has(palavra)) continue;
      vistas.add(palavra);
      frequencia.set(palavra, (frequencia.get(palavra) ?? 0) + 1);
    }
  }

  return [...frequencia.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_VOCAB)
    .map(([palavra]) => palavra);
}

function apelidosDe(nomePasta, nomeExibicao, remote, extras) {
  const apelidos = new Set([semAcento(nomePasta), semAcento(nomeExibicao)]);

  const repo = remote.match(/([^/]+?)(?:\.git)?$/)?.[1];
  if (repo) apelidos.add(semAcento(repo));

  for (const base of [...apelidos]) {
    const partes = base.split(/[-_\s]+/).filter((p) => p.length >= 3);
    if (partes.length > 1) {
      apelidos.add(partes.join(' '));
      apelidos.add(partes.join(''));
      for (const p of partes) apelidos.add(p);
    }
  }

  for (const extra of extras ?? []) apelidos.add(semAcento(extra));

  return [...apelidos].filter(Boolean).sort();
}

const CORES = [
  '#22d3ee', '#a78bfa', '#f59e0b', '#34d399', '#f472b6',
  '#60a5fa', '#fb923c', '#4ade80', '#c084fc', '#facc15',
];

function main() {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - MESES);
  const trintaDias = new Date();
  trintaDias.setDate(trintaDias.getDate() - 30);
  const corte30 = trintaDias.toISOString().slice(0, 10);

  const projetos = [];
  const ignorados = [];

  for (const entrada of readdirSync(RAIZ, { withFileTypes: true })) {
    if (!entrada.isDirectory()) continue;
    const dir = join(RAIZ, entrada.name);
    if (!existsSync(join(dir, '.git'))) continue;

    const over = OVERRIDES[entrada.name] ?? {};
    if (over.ignorar) {
      ignorados.push(`${entrada.name} — ${over.ignorar}`);
      continue;
    }

    const remote = git(dir, 'remote', 'get-url', 'origin');
    const commits = lerCommits(dir);
    if (commits.length === 0) continue;

    const ultimo = commits[0].data;
    const ativo = new Date(ultimo) >= limite;
    if (!ativo && !remote.includes('github.com')) {
      ignorados.push(`${entrada.name} — parado desde ${ultimo} e sem remote`);
      continue;
    }

    const nome = over.nome ?? entrada.name;
    const recentes = commits.filter((c) => c.data >= corte30);

    projetos.push({
      name: nome,
      status: ativo ? 'Active' : 'Legacy',
      type: 'Software',
      progress: 0,
      stack: detectarStack(dir),
      repo: remote.includes('github.com')
        ? remote.replace(/^.*github\.com[:/]/, '').replace(/\.git$/, '')
        : null,
      aliases: apelidosDe(entrada.name, nome, remote, over.aliases),
      vocab: minerarVocabulario(commits),
      ultimoCommit: ultimo,
      evolucoes30d: recentes.filter((c) => c.tipo === 'evoluiu').length,
      correcoes30d: recentes.filter((c) => c.tipo === 'corrigiu').length,
      historico: commits.slice(0, COMMITS_NO_HISTORICO),
    });
  }

  projetos.sort((a, b) => b.ultimoCommit.localeCompare(a.ultimoCommit));
  projetos.forEach((p, i) => { p.color = CORES[i % CORES.length]; });

  const conteudo = `// GERADO por scripts/gerar-catalogo.mjs em ${new Date().toISOString().slice(0, 10)}.
// Rode de novo quando criar repositórios novos.
// Para renomear projetos ou marcar duplicatas, edite OVERRIDES no gerador —
// não edite este arquivo, ele é sobrescrito.
import type { CatalogoProjeto } from './tipos';

export const CATALOGO: CatalogoProjeto[] = ${JSON.stringify(projetos, null, 2)};
`;

  mkdirSync(dirname(SAIDA), { recursive: true });
  writeFileSync(SAIDA, conteudo, 'utf8');

  console.log(`${projetos.length} projetos | ${ignorados.length} ignorados\n`);
  for (const p of projetos) {
    console.log(
      `${p.ultimoCommit}  ${p.name.padEnd(24)}  ${String(p.evolucoes30d).padStart(2)} evoluções, ` +
      `${String(p.correcoes30d).padStart(2)} correções (30d)  ${p.stack}`
    );
    console.log(`  vocab: ${p.vocab.slice(0, 10).join(', ') || '(nenhum)'}`);
  }
  if (ignorados.length) {
    console.log('\nIgnorados:');
    for (const i of ignorados) console.log(`  ${i}`);
  }
  console.log(`\nEscrito em ${SAIDA}`);
}

main();
