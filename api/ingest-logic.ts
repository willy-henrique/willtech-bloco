/**
 * Lógica pura do endpoint de ingestão do WillTech Bloco.
 *
 * Sem imports de firebase e sem efeitos colaterais: este arquivo é testado
 * pelo vitest e compartilhado entre a função Vercel (api/ingest.ts) e o
 * plugin de desenvolvimento do Vite. Toda validação e sanitização do
 * payload acontece aqui, para o que entra no Firestore ser sempre limpo.
 */
import type { PlatformName, ProjectEndpoint, ProjectPlatform } from '../types';
import { PLATFORMS } from '../types';

export type IngestAction =
  | 'upsert_project'
  | 'upsert_platform'
  | 'upsert_endpoint'
  | 'add_note'
  | 'add_task'
  | 'upsert_credential';

export const ACOES: Array<{ acao: IngestAction; descricao: string }> = [
  { acao: 'upsert_project', descricao: 'Cria ou atualiza um projeto (name, repo, stack, deployUrl, ownerEmail, platforms, endpoints).' },
  { acao: 'upsert_platform', descricao: 'Adiciona/atualiza uma conta de plataforma (ex: email usado no Vercel) em um projeto.' },
  { acao: 'upsert_endpoint', descricao: 'Adiciona/atualiza um endpoint conhecido de um projeto.' },
  { acao: 'add_note', descricao: 'Registra uma anotação em um projeto.' },
  { acao: 'add_task', descricao: 'Cria uma tarefa em um projeto.' },
  { acao: 'upsert_credential', descricao: 'Cria/atualiza uma credencial de desenvolvimento de um projeto.' },
];

export type ResultadoParse =
  | { ok: true; action: IngestAction; data: Record<string, unknown> }
  | { ok: false; erro: string };

export type PayloadLimpo = Record<string, unknown>;

const STATUS_VALIDOS = ['Active', 'Maintenance', 'Legacy'] as const;
const PRIORIDADES_VALIDAS = ['Critical', 'Urgent', 'Normal', 'Low'] as const;

const MAX_STR = 500;
const MAX_TEXTO = 4000;

/** Aceita só string, trima e corta no limite. null = inválido para campos obrigatórios. */
function stringObrigatoria(valor: unknown, max = MAX_STR, rotulo: string): string | null {
  if (typeof valor !== 'string') return null;
  const s = valor.trim();
  if (s.length === 0) return null;
  if (s.length > max) return null;
  return s;
}

/** Campos opcionais: tipos errados viram undefined; strings são trimadas e cortadas. */
function stringOpcional(valor: unknown, max = MAX_STR): string | undefined {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (typeof valor !== 'string') return undefined;
  const s = valor.trim();
  if (s.length === 0) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}

function numeroOpcional(valor: unknown, min: number, max: number): number | undefined {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return undefined;
  return Math.min(max, Math.max(min, valor));
}

function listaDeStrings(valor: unknown, maxItens: number, maxPorItem = 100): string[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  const limpas: string[] = [];
  for (const item of valor) {
    if (typeof item !== 'string') continue;
    const s = item.trim();
    if (s && s.length <= maxPorItem) limpas.push(s);
    if (limpas.length >= maxItens) break;
  }
  return limpas.length ? limpas : undefined;
}

export function validarPlataforma(p: unknown): ProjectPlatform | null {
  if (typeof p !== 'object' || p === null) return null;
  const obj = p as Record<string, unknown>;
  if (!PLATFORMS.includes(obj.platform as PlatformName)) return null;
  const email = stringObrigatoria(obj.email, MAX_STR, 'email');
  if (!email) return null;
  return {
    id: stringOpcional(obj.id, 100) ?? `plf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    platform: obj.platform as PlatformName,
    email,
    ...(stringOpcional(obj.accountName) ? { accountName: stringOpcional(obj.accountName) } : {}),
    ...(stringOpcional(obj.projectName) ? { projectName: stringOpcional(obj.projectName) } : {}),
    ...(stringOpcional(obj.consoleUrl) ? { consoleUrl: stringOpcional(obj.consoleUrl) } : {}),
    ...(stringOpcional(obj.notes, MAX_TEXTO) ? { notes: stringOpcional(obj.notes, MAX_TEXTO) } : {}),
    updatedAt: Date.now(),
  };
}

export function validarEndpoint(e: unknown): ProjectEndpoint | null {
  if (typeof e !== 'object' || e === null) return null;
  const obj = e as Record<string, unknown>;
  const label = stringObrigatoria(obj.label, 200, 'label');
  const url = stringObrigatoria(obj.url, MAX_STR, 'url');
  if (!label || !url) return null;
  return {
    id: stringOpcional(obj.id, 100) ?? `ept_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    label,
    url,
    ...(stringOpcional(obj.method, 20) ? { method: stringOpcional(obj.method, 20) } : {}),
    ...(stringOpcional(obj.auth, 200) ? { auth: stringOpcional(obj.auth, 200) } : {}),
    ...(stringOpcional(obj.notes, MAX_TEXTO) ? { notes: stringOpcional(obj.notes, MAX_TEXTO) } : {}),
    updatedAt: Date.now(),
  };
}

function limparPayload(action: IngestAction, data: Record<string, unknown>): PayloadLimpo | string {
  switch (action) {
    case 'upsert_project': {
      const name = stringObrigatoria(data.name, 120, 'name');
      if (!name) return 'upsert_project: campo obrigatório "name" (string, máx. 120).';
      const limpo: PayloadLimpo = { name };
      const id = stringOpcional(data.id, 100);
      if (id) limpo.id = id;
      const status = stringOpcional(data.status, 20);
      if (status) {
        if (!STATUS_VALIDOS.includes(status as (typeof STATUS_VALIDOS)[number])) {
          return 'upsert_project: "status" deve ser Active, Maintenance ou Legacy.';
        }
        limpo.status = status;
      }
      const type = stringOpcional(data.type, 120);
      if (type) limpo.type = type;
      const stack = stringOpcional(data.stack, 300);
      if (stack) limpo.stack = stack;
      const repo = stringOpcional(data.repo, 200);
      if (repo) limpo.repo = repo;
      const deployUrl = stringOpcional(data.deployUrl, MAX_STR);
      if (deployUrl) limpo.deployUrl = deployUrl;
      const ownerEmail = stringOpcional(data.ownerEmail, 200);
      if (ownerEmail) limpo.ownerEmail = ownerEmail;
      const color = stringOpcional(data.color, 40);
      if (color) limpo.color = color;
      const progress = numeroOpcional(data.progress, 0, 100);
      if (progress !== undefined) limpo.progress = progress;
      const aliases = listaDeStrings(data.aliases, 20, 80);
      if (aliases) limpo.aliases = aliases;
      const vocab = listaDeStrings(data.vocab, 30, 80);
      if (vocab) limpo.vocab = vocab;
      if (Array.isArray(data.platforms)) {
        const plataformas: ProjectPlatform[] = [];
        for (const item of data.platforms.slice(0, 30)) {
          const valida = validarPlataforma(item);
          if (valida) plataformas.push(valida);
        }
        if (plataformas.length) limpo.platforms = plataformas;
      }
      if (Array.isArray(data.endpoints)) {
        const endpoints: ProjectEndpoint[] = [];
        for (const item of data.endpoints.slice(0, 50)) {
          const valido = validarEndpoint(item);
          if (valido) endpoints.push(valido);
        }
        if (endpoints.length) limpo.endpoints = endpoints;
      }
      return limpo;
    }

    case 'upsert_platform': {
      const projectId = stringObrigatoria(data.projectId, 100, 'projectId');
      if (!projectId) return 'upsert_platform: campo obrigatório "projectId".';
      const plataforma = validarPlataforma(data.plataforma ?? data.platform);
      if (!plataforma) {
        return 'upsert_platform: "plataforma" inválida. Ex.: { platform: "vercel", email: "eu@email.com", projectName: "meu-app" }.';
      }
      return { projectId, plataforma };
    }

    case 'upsert_endpoint': {
      const projectId = stringObrigatoria(data.projectId, 100, 'projectId');
      if (!projectId) return 'upsert_endpoint: campo obrigatório "projectId".';
      const endpoint = validarEndpoint(data.endpoint);
      if (!endpoint) return 'upsert_endpoint: "endpoint" inválido. Ex.: { label: "API", url: "https://..." }.';
      return { projectId, endpoint };
    }

    case 'add_note': {
      const projectId = stringObrigatoria(data.projectId, 100, 'projectId');
      const title = stringObrigatoria(data.title, 200, 'title');
      const content = stringObrigatoria(data.content, MAX_TEXTO, 'content');
      if (!projectId || !title || !content) {
        return 'add_note: campos obrigatórios "projectId", "title" e "content".';
      }
      const limpo: PayloadLimpo = { projectId, title, content };
      const category = stringOpcional(data.category, 80);
      if (category) limpo.category = category;
      return limpo;
    }

    case 'add_task': {
      const projectId = stringObrigatoria(data.projectId, 100, 'projectId');
      const description = stringObrigatoria(data.description, MAX_TEXTO, 'description');
      if (!projectId || !description) return 'add_task: campos obrigatórios "projectId" e "description".';
      const limpo: PayloadLimpo = { projectId, description };
      const priority = stringOpcional(data.priority, 20);
      if (priority) {
        if (!PRIORIDADES_VALIDAS.includes(priority as (typeof PRIORIDADES_VALIDAS)[number])) {
          return 'add_task: "priority" deve ser Critical, Urgent, Normal ou Low.';
        }
        limpo.priority = priority;
      }
      return limpo;
    }

    case 'upsert_credential': {
      const projectId = stringObrigatoria(data.projectId, 100, 'projectId');
      const title = stringObrigatoria(data.title, 200, 'title');
      if (!projectId || !title) return 'upsert_credential: campos obrigatórios "projectId" e "title".';
      const limpo: PayloadLimpo = { projectId, title };
      for (const campo of ['username', 'email', 'password', 'url', 'notes'] as const) {
        const valor = stringOpcional(data[campo], campo === 'password' ? MAX_STR : MAX_TEXTO);
        if (valor) limpo[campo] = valor;
      }
      const env = stringOpcional(data.env, MAX_TEXTO);
      if (env) limpo.env = env;
      return limpo;
    }

    default:
      return `Ação desconhecida: ${String(action)}.`;
  }
}

export function parseIngestRequest(raw: unknown): ResultadoParse {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, erro: 'Corpo deve ser um objeto JSON.' };
  }
  const obj = raw as Record<string, unknown>;
  const action = obj.action;
  if (typeof action !== 'string' || !ACOES.some((a) => a.acao === action)) {
    return { ok: false, erro: `Campo "action" obrigatório. Ações válidas: ${ACOES.map((a) => a.acao).join(', ')}.` };
  }
  if (typeof obj.data !== 'object' || obj.data === null || Array.isArray(obj.data)) {
    return { ok: false, erro: 'Campo "data" deve ser um objeto JSON.' };
  }
  const limpo = limparPayload(action as IngestAction, obj.data as Record<string, unknown>);
  if (typeof limpo === 'string') return { ok: false, erro: limpo };
  return { ok: true, action: action as IngestAction, data: limpo };
}
