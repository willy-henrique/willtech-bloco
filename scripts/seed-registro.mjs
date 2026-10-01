#!/usr/bin/env node
/**
 * Seed do registro de projetos do WillTech Bloco.
 *
 * Uso (rodar a partir da raiz do repositório):
 *   node scripts/seed-registro.mjs --key .keys/willtech-a9bb6-adminsdk.json [--wipe] [--only id1,id2]
 *
 * --wipe  Apaga as coleções operacionais e repopula do zero.
 *         PRESERVADAS (dados sensíveis/irreversíveis): vault,
 *         project_credentials, project_payments e system.
 * --only  Restringe o seed a uma lista de ids (separada por vírgula).
 *
 * A chave da service account nunca é versionada (.keys/ está no .gitignore).
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const valorDe = (nome) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 ? args[i + 1] : null;
};

const caminhoChave = valorDe('key');
if (!caminhoChave) {
  console.error('Uso: node scripts/seed-registro.mjs --key <caminho-do-adminsdk.json> [--wipe] [--only id1,id2]');
  process.exit(1);
}
const comWipe = args.includes('--wipe');
const somente = valorDe('only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;

const conta = JSON.parse(readFileSync(path.resolve(caminhoChave), 'utf8'));
initializeApp({ credential: cert(conta) });
const db = getFirestore();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(__dirname, 'registro-seed.json'), 'utf8'));

// Coleções operacionais recriadas pelo seed (wipe apaga só estas).
const APAGAR = [
  'projects',
  'tasks',
  'project_notes',
  'project_details',
  'snippets',
  'deadlines',
  'project_inbox',
  'capture_inbox',
  'project_signals',
  'project_events',
  'sync_runs',
];
const PRESERVADAS = ['vault', 'project_credentials', 'project_payments', 'system'];

const slug = (nome) =>
  (nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)) || 'projeto';

async function apagarColecao(nome) {
  const ref = db.collection(nome);
  const snap = await ref.get();
  if (snap.empty) return 0;
  const lotes = [];
  let lote = db.batch();
  let noLote = 0;
  for (const docSnap of snap.docs) {
    lote.delete(docSnap.ref);
    noLote += 1;
    if (noLote === 400) {
      lotes.push(lote);
      lote = db.batch();
      noLote = 0;
    }
  }
  if (noLote > 0) lotes.push(lote);
  await Promise.all(lotes.map((l) => l.commit()));
  return snap.size;
}

async function principal() {
  const agora = new Date();

  if (comWipe) {
    console.log('== WIPE das coleções operacionais ==');
    for (const nome of APAGAR) {
      const n = await apagarColecao(nome);
      console.log(`   ${nome}: ${n} doc(s) apagado(s)`);
    }
    console.log(`   PRESERVADAS: ${PRESERVADAS.join(', ')}`);
    console.log('');
  }

  let criados = 0;
  let atualizados = 0;
  console.log('== SEED do registro ==');
  for (const item of seed.projetos) {
    const id = item.id ?? slug(item.dados.name);
    if (somente && !somente.includes(id)) continue;
    const { notes_inline, ...dados } = item.dados;
    const ref = db.collection('projects').doc(id);
    const existia = (await ref.get()).exists;
    await ref.set(
      { ...dados, updatedAt: agora, ...(existia ? {} : { createdAt: agora }) },
      { merge: true },
    );
    if (notes_inline) {
      await db.collection('project_notes').add({
        projectId: id,
        title: 'Registro inicial',
        content: notes_inline,
        category: 'infra',
        createdAt: agora,
      });
    }
    if (existia) atualizados += 1;
    else criados += 1;
    console.log(`   ${existia ? '~' : '+'} ${id}`);
  }

  const total = (await db.collection('projects').get()).size;
  console.log('');
  console.log(`Pronto. ${criados} criados, ${atualizados} atualizados. Total no Firestore: ${total}.`);
}

principal().catch((erro) => {
  console.error('Falha no seed:', erro);
  process.exit(1);
});
