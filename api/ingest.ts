/**
 * POST /api/ingest — endpoint de ingestão do WillTech Bloco.
 *
 * Recebe dados de projetos/contas/endpoints/notas/tarefas de qualquer
 * integração (Hermes, n8n, scripts, outros apps) e grava no Firestore
 * com o Admin SDK (ignora as regras do painel — por isso a chave de API
 * é exigida em todo POST).
 *
 * Configuração (uma vez):
 *   FIREBASE_SERVICE_ACCOUNT — conteúdo do JSON da service account do
 *   projeto Firebase `willtech-a9bb6` (variável de ambiente no Vercel).
 *   INGEST_API_KEY (opcional) — chave fixa no servidor. Se ausente, vale
 *   a chave gerada no painel (Firestore: system/ingest.apiKey).
 *
 * GET /api/ingest — status + documentação resumida (sem autenticação).
 */
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { IngestAction, PayloadLimpo } from './ingest-logic';
import { ACOES, parseIngestRequest } from './ingest-logic';

interface Req {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface Res {
  status(codigo: number): Res;
  json(payload: unknown): void;
  setHeader(nome: string, valor: string): Res | void;
}

function iniciarBanco(): Firestore | null {
  try {
    const app = getApps().length
      ? getApp()
      : (() => {
          const bruto = process.env.FIREBASE_SERVICE_ACCOUNT;
          if (!bruto) return null;
          const conta = JSON.parse(bruto);
          return initializeApp({ credential: cert(conta) }, 'willtech-bloco-ingest');
        })();
    return app ? getFirestore(app) : null;
  } catch (erro) {
    console.error('Falha ao iniciar o Admin SDK:', erro);
    return null;
  }
}

function pegarHeader(headers: Req['headers'], nome: string): string | undefined {
  if (!headers) return undefined;
  const alvo = Object.keys(headers).find((k) => k.toLowerCase() === nome.toLowerCase());
  if (!alvo) return undefined;
  const valor = headers[alvo];
  return Array.isArray(valor) ? valor[0] : valor;
}

function chavesIguais(enviada: string, esperada: string): boolean {
  const a = createHash('sha256').update(enviada).digest();
  const b = createHash('sha256').update(esperada).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

async function chaveEsperada(db: Firestore): Promise<string | null> {
  if (process.env.INGEST_API_KEY) return process.env.INGEST_API_KEY;
  try {
    const snap = await db.collection('system').doc('ingest').get();
    const dados = snap.data() as { apiKey?: string } | undefined;
    return dados?.apiKey ?? null;
  } catch {
    return null;
  }
}

async function chaveConfigurada(db: Firestore | null): Promise<boolean> {
  if (!db) return false;
  if (process.env.INGEST_API_KEY) return true;
  return Boolean(await chaveEsperada(db));
}

/** id de documento estável e legível para projetos novos. */
function slugDoNome(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'projeto';
}

async function executarAcao(
  db: Firestore,
  action: IngestAction,
  data: PayloadLimpo,
): Promise<Record<string, unknown>> {
  switch (action) {
    case 'upsert_project': {
      const projetos = db.collection('projects');
      let ref = projetos.doc();
      if (typeof data.id === 'string' && data.id) {
        ref = projetos.doc(data.id);
      } else if (typeof data.repo === 'string' && data.repo) {
        const porRepo = await projetos.where('repo', '==', data.repo).limit(1).get();
        if (!porRepo.empty) ref = porRepo.docs[0].ref;
      }
      if (!ref.id || ref.id.length > 90) {
        const porNome = await projetos
          .where('name', '==', data.name as string)
          .limit(1)
          .get();
        ref = porNome.empty ? projetos.doc(slugDoNome(data.name as string)) : porNome.docs[0].ref;
      }
      const campos = { ...data };
      delete campos.id;
      const existia = (await ref.get()).exists;
      await ref.set(
        { ...campos, ...(existia ? {} : { createdAt: Timestamp.now() }), updatedAt: Timestamp.now() },
        { merge: true },
      );
      return { action, projectId: ref.id, criado: !existia };
    }

    case 'upsert_platform': {
      const ref = db.collection('projects').doc(data.projectId as string);
      if (!(await ref.get()).exists) return { action, erro: 'Projeto não encontrado.' };
      const nova = data.plataforma as Record<string, unknown>;
      const doc = (await ref.get()).data() ?? {};
      const plataformas = Array.isArray(doc.platforms) ? [...(doc.platforms as Record<string, unknown>[])] : [];
      const indice = plataformas.findIndex(
        (p) =>
          (nova.id && p.id === nova.id) ||
          (p.platform === nova.platform && p.projectName === nova.projectName && p.email === nova.email),
      );
      if (indice >= 0) plataformas[indice] = { ...plataformas[indice], ...nova };
      else plataformas.push(nova);
      await ref.set({ platforms: plataformas, updatedAt: Timestamp.now() }, { merge: true });
      return { action, projectId: ref.id, totalPlataformas: plataformas.length };
    }

    case 'upsert_endpoint': {
      const ref = db.collection('projects').doc(data.projectId as string);
      if (!(await ref.get()).exists) return { action, erro: 'Projeto não encontrado.' };
      const novo = data.endpoint as Record<string, unknown>;
      const doc = (await ref.get()).data() ?? {};
      const endpoints = Array.isArray(doc.endpoints) ? [...(doc.endpoints as Record<string, unknown>[])] : [];
      const indice = endpoints.findIndex(
        (e) => (novo.id && e.id === novo.id) || (e.label === novo.label && e.url === novo.url),
      );
      if (indice >= 0) endpoints[indice] = { ...endpoints[indice], ...novo };
      else endpoints.push(novo);
      await ref.set({ endpoints, updatedAt: Timestamp.now() }, { merge: true });
      return { action, projectId: ref.id, totalEndpoints: endpoints.length };
    }

    case 'add_note': {
      const ref = await db.collection('project_notes').add({
        projectId: data.projectId,
        title: data.title,
        content: data.content,
        ...(data.category ? { category: data.category } : {}),
        createdAt: Timestamp.now(),
      });
      return { action, noteId: ref.id };
    }

    case 'add_task': {
      const ref = await db.collection('tasks').add({
        projectId: data.projectId,
        description: data.description,
        priority: (data.priority as string) ?? 'Normal',
        isCompleted: false,
        createdAt: Timestamp.now(),
      });
      return { action, taskId: ref.id };
    }

    case 'upsert_credential': {
      const credenciais = db.collection('project_credentials');
      const porTitulo = await credenciais
        .where('projectId', '==', data.projectId as string)
        .where('title', '==', data.title as string)
        .limit(1)
        .get();
      const campos = { ...data };
      if (porTitulo.empty) {
        const ref = await credenciais.add({ ...campos, createdAt: Timestamp.now() });
        return { action, credentialId: ref.id, criado: true };
      }
      await porTitulo.docs[0].ref.set({ ...campos, updatedAt: Timestamp.now() }, { merge: true });
      return { action, credentialId: porTitulo.docs[0].id, criado: false };
    }

    default:
      return { action, erro: 'Ação desconhecida.' };
  }
}

export default async function handler(req: Req, res: Res) {
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).json({});
    return;
  }

  if (req.method === 'GET') {
    const db = iniciarBanco();
    res.status(200).json({
      servico: 'willtech-bloco/ingest',
      versao: 1,
      configurado: Boolean(db),
      chaveConfigurada: await chaveConfigurada(db),
      acoes: ACOES,
      uso: 'POST com Authorization: Bearer <chave> e corpo { action, data }.',
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, erro: 'Use GET (status) ou POST (ingestão).' });
    return;
  }

  const db = iniciarBanco();
  if (!db) {
    res.status(503).json({
      ok: false,
      codigo: 'not_configured',
      erro: 'Endpoint ainda não configurado: falta a variável FIREBASE_SERVICE_ACCOUNT no Vercel.',
    });
    return;
  }

  const chave = await chaveEsperada(db);
  if (!chave) {
    res.status(503).json({
      ok: false,
      codigo: 'no_key',
      erro: 'Nenhuma chave de API configurada. Gere uma no painel em Integrações.',
    });
    return;
  }

  const autorizacao = pegarHeader(req.headers, 'authorization');
  const enviada =
    typeof autorizacao === 'string' && autorizacao.startsWith('Bearer ')
      ? autorizacao.slice('Bearer '.length).trim()
      : '';
  if (!enviada || !chavesIguais(enviada, chave)) {
    res.status(401).json({ ok: false, erro: 'Chave de API inválida ou ausente.' });
    return;
  }

  let corpo: unknown = req.body;
  if (typeof corpo === 'string') {
    try {
      corpo = JSON.parse(corpo);
    } catch {
      res.status(400).json({ ok: false, erro: 'Corpo deve ser JSON válido.' });
      return;
    }
  }

  const parse = parseIngestRequest(corpo);
  if (parse.ok === false) {
    res.status(400).json({ ok: false, erro: parse.erro });
    return;
  }

  try {
    const resultado = await executarAcao(db, parse.action, parse.data);
    if (resultado.erro) {
      res.status(404).json({ ok: false, erro: resultado.erro });
      return;
    }
    res.status(200).json({ ok: true, ...resultado });
  } catch (erro) {
    console.error('Falha na ingestão:', erro);
    res.status(500).json({ ok: false, erro: erro instanceof Error ? erro.message : 'Falha interna.' });
  }
}
