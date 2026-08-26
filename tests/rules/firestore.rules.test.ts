// @vitest-environment node
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const RULES = readFileSync('firestore.rules', 'utf8');

const emailMatch = RULES.match(/function ownerEmail\(\) \{ return '([^']+)'; \}/);
if (!emailMatch) {
  throw new Error(
    "firestore.rules precisa conter exatamente: function ownerEmail() { return '<email>'; }"
  );
}
const OWNER_EMAIL = emailMatch[1];

const HUMAN_COLLECTIONS = [
  'projects', 'tasks', 'snippets', 'vault',
  'project_credentials', 'project_payments', 'project_notes', 'project_details', 'deadlines',
];

const MACHINE_COLLECTIONS = [
  'project_signals', 'project_events', 'project_inbox', 'capture_inbox', 'sync_runs',
];

let testEnv: RulesTestEnvironment;

/** O dono, autenticado com o e-mail que as rules exigem. */
const dono = () =>
  testEnv.authenticatedContext('uid-do-dono', { email: OWNER_EMAIL }).firestore();

/** Alguém logado de verdade, mas com outro e-mail. */
const intruso = () =>
  testEnv.authenticatedContext('uid-do-intruso', { email: 'intruso@gmail.com' }).firestore();

/** Ninguém logado. */
const anonimo = () => testEnv.unauthenticatedContext().firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'willtech-rules-test',
    firestore: { host: '127.0.0.1', port: 8080, rules: RULES },
  });
});

afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

describe('o e-mail do dono', () => {
  it('não é um placeholder', () => {
    expect(OWNER_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  });
});

describe('coleções humanas', () => {
  it.each(HUMAN_COLLECTIONS)('nega leitura anônima em %s', async (col) => {
    await assertFails(getDoc(doc(anonimo(), col, 'x')));
  });

  it.each(HUMAN_COLLECTIONS)('nega escrita anônima em %s', async (col) => {
    await assertFails(setDoc(doc(anonimo(), col, 'x'), { a: 1 }));
  });

  it.each(HUMAN_COLLECTIONS)('nega leitura de outro e-mail logado em %s', async (col) => {
    await assertFails(getDoc(doc(intruso(), col, 'x')));
  });

  it.each(HUMAN_COLLECTIONS)('nega escrita de outro e-mail logado em %s', async (col) => {
    await assertFails(setDoc(doc(intruso(), col, 'x'), { a: 1 }));
  });

  it.each(HUMAN_COLLECTIONS)('permite leitura e escrita do dono em %s', async (col) => {
    await assertSucceeds(setDoc(doc(dono(), col, 'x'), { a: 1 }));
    await assertSucceeds(getDoc(doc(dono(), col, 'x')));
  });
});

describe('coleções de máquina', () => {
  it.each(MACHINE_COLLECTIONS)('permite o dono ler %s', async (col) => {
    await assertSucceeds(getDoc(doc(dono(), col, 'x')));
  });

  it.each(MACHINE_COLLECTIONS)('nega escrita até do dono em %s (só Admin SDK)', async (col) => {
    await assertFails(setDoc(doc(dono(), col, 'x'), { a: 1 }));
  });

  it.each(MACHINE_COLLECTIONS)('nega leitura anônima em %s', async (col) => {
    await assertFails(getDoc(doc(anonimo(), col, 'x')));
  });

  it.each(MACHINE_COLLECTIONS)('nega leitura de outro e-mail logado em %s', async (col) => {
    await assertFails(getDoc(doc(intruso(), col, 'x')));
  });
});

describe('coleção desconhecida', () => {
  it('é negada até para o dono', async () => {
    await assertFails(getDoc(doc(dono(), 'colecao_inventada', 'x')));
    await assertFails(setDoc(doc(dono(), 'colecao_inventada', 'x'), { a: 1 }));
  });
});
