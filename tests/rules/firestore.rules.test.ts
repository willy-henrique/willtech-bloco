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

const uidMatch = RULES.match(/function ownerUid\(\) \{ return '([^']+)'; \}/);
if (!uidMatch) {
  throw new Error(
    "firestore.rules precisa conter exatamente: function ownerUid() { return '<UID>'; }"
  );
}
const OWNER_UID = uidMatch[1];
const INTRUDER_UID = 'intruso-nao-autorizado';

const HUMAN_COLLECTIONS = [
  'projects', 'tasks', 'snippets', 'vault',
  'project_credentials', 'project_payments', 'project_notes', 'project_details',
];

const MACHINE_COLLECTIONS = [
  'project_signals', 'project_events', 'project_inbox', 'capture_inbox', 'sync_runs',
];

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'willtech-rules-test',
    firestore: { host: '127.0.0.1', port: 8080, rules: RULES },
  });
});

afterAll(async () => { await testEnv.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

describe('o UID do dono', () => {
  it('não é um placeholder', () => {
    expect(OWNER_UID).toMatch(/^[A-Za-z0-9]{20,}$/);
  });
});

describe('coleções humanas', () => {
  it.each(HUMAN_COLLECTIONS)('nega leitura anônima em %s', async (col) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, col, 'x')));
  });

  it.each(HUMAN_COLLECTIONS)('nega escrita anônima em %s', async (col) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, col, 'x'), { a: 1 }));
  });

  it.each(HUMAN_COLLECTIONS)('nega leitura de outro usuário logado em %s', async (col) => {
    const db = testEnv.authenticatedContext(INTRUDER_UID).firestore();
    await assertFails(getDoc(doc(db, col, 'x')));
  });

  it.each(HUMAN_COLLECTIONS)('permite leitura e escrita do dono em %s', async (col) => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(setDoc(doc(db, col, 'x'), { a: 1 }));
    await assertSucceeds(getDoc(doc(db, col, 'x')));
  });
});

describe('coleções de máquina', () => {
  it.each(MACHINE_COLLECTIONS)('permite o dono ler %s', async (col) => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(getDoc(doc(db, col, 'x')));
  });

  it.each(MACHINE_COLLECTIONS)('nega escrita até do dono em %s (só Admin SDK)', async (col) => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(setDoc(doc(db, col, 'x'), { a: 1 }));
  });

  it.each(MACHINE_COLLECTIONS)('nega leitura anônima em %s', async (col) => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, col, 'x')));
  });
});

describe('coleção desconhecida', () => {
  it('é negada até para o dono', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(getDoc(doc(db, 'colecao_inventada', 'x')));
    await assertFails(setDoc(doc(db, 'colecao_inventada', 'x'), { a: 1 }));
  });
});
