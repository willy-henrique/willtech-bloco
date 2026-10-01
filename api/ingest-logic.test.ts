import { describe, expect, it } from 'vitest';
import { parseIngestRequest } from './ingest-logic';

describe('parseIngestRequest', () => {
  it('aceita upsert_project completo e sanitiza', () => {
    const r = parseIngestRequest({
      action: 'upsert_project',
      data: {
        name: '  Meu App ',
        repo: 'willy-henrique/meu-app',
        status: 'Active',
        deployUrl: 'https://meu-app.vercel.app',
        ownerEmail: 'willydev01@gmail.com',
        progress: 42,
        junk: 'deve sumir',
        platforms: [{ platform: 'vercel', email: ' willydev01@gmail.com ', projectName: 'meu-app' }],
        endpoints: [{ label: 'API', url: 'https://api.meu-app.com', method: 'GET' }],
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.name).toBe('Meu App');
    expect(r.data.junk).toBeUndefined();
    expect(r.data.platforms).toHaveLength(1);
    expect(r.data.platforms[0].email).toBe('willydev01@gmail.com');
    expect(r.data.endpoints[0].url).toBe('https://api.meu-app.com');
  });

  it('rejeita ação desconhecida', () => {
    const r = parseIngestRequest({ action: 'drop_everything', data: {} });
    expect(r.ok).toBe(false);
  });

  it('rejeita corpo sem data', () => {
    const r = parseIngestRequest({ action: 'add_note' });
    expect(r.ok).toBe(false);
  });

  it('exige name em upsert_project', () => {
    const r = parseIngestRequest({ action: 'upsert_project', data: { repo: 'x/y' } });
    expect(r.ok).toBe(false);
  });

  it('exige campos de add_note', () => {
    expect(parseIngestRequest({ action: 'add_note', data: { projectId: 'p1', title: 't' } }).ok).toBe(false);
    const r = parseIngestRequest({ action: 'add_note', data: { projectId: 'p1', title: 't', content: 'c' } });
    expect(r.ok).toBe(true);
  });

  it('valida prioridade de add_task', () => {
    const r = parseIngestRequest({ action: 'add_task', data: { projectId: 'p1', description: 'd', priority: 'Absurda' } });
    expect(r.ok).toBe(false);
    const ok = parseIngestRequest({ action: 'add_task', data: { projectId: 'p1', description: 'd', priority: 'Urgent' } });
    expect(ok.ok).toBe(true);
  });

  it('exige plataforma válida em upsert_platform', () => {
    const r = parseIngestRequest({ action: 'upsert_platform', data: { projectId: 'p1', plataforma: { platform: 'marte', email: 'a@b.c' } } });
    expect(r.ok).toBe(false);
  });

  it('rejeita plataforma sem email', () => {
    const r = parseIngestRequest({ action: 'upsert_platform', data: { projectId: 'p1', plataforma: { platform: 'vercel' } } });
    expect(r.ok).toBe(false);
  });

  it('exige url e label em upsert_endpoint', () => {
    const r = parseIngestRequest({ action: 'upsert_endpoint', data: { projectId: 'p1', endpoint: { label: 'API' } } });
    expect(r.ok).toBe(false);
  });

  it('aceita credencial com senha', () => {
    const r = parseIngestRequest({
      action: 'upsert_credential',
      data: { projectId: 'p1', title: 'Admin', password: 'segredo', username: 'admin' },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.password).toBe('segredo');
  });
});
