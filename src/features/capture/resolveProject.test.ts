import { describe, it, expect } from 'vitest';
import { resolveProject, deriveAliases, type ResolvableProject } from './resolveProject';

const MAVO_TALK: ResolvableProject = {
  id: 'willtalk',
  name: 'Mavo Talk',
  aliases: ['talk', 'willtalk', 'mavotalk'],
  vocab: ['whatsapp', 'sessao', 'atendimento', 'fila', 'chamado', 'supabase', 'render'],
};

const MAVO_AI: ResolvableProject = {
  id: 'mavoai',
  name: 'Mavo AI',
  aliases: ['mavoai', 'chat inteligente'],
  vocab: ['rag', 'embedding', 'pgvector', 'agente', 'orquestrador', 'jina', 'qwen'],
};

const MAVO_GER: ResolvableProject = {
  id: 'mavo-metricas',
  name: 'Mavo Gerenciamento',
  aliases: ['gerenciamento', 'metricas'],
  vocab: ['relatorio', 'pdf', 'painel do cliente'],
};

const PESQUE: ResolvableProject = {
  id: 'pesque-pague',
  name: 'WillTech Pesqueiros',
  aliases: ['pesqueiro', 'pesque e pague'],
  vocab: ['qr code', 'comanda', 'balanca'],
};

const TODOS = [MAVO_TALK, MAVO_AI, MAVO_GER, PESQUE];

describe('deriveAliases', () => {
  it('deriva o nome completo e a versão sem espaço', () => {
    expect(deriveAliases('Mavo Talk')).toContain('mavo talk');
    expect(deriveAliases('Mavo Talk')).toContain('mavotalk');
  });

  it('deriva as palavras individuais do nome', () => {
    expect(deriveAliases('Mavo Talk')).toContain('mavo');
    expect(deriveAliases('Mavo Talk')).toContain('talk');
  });

  it('ignora palavras com menos de 3 letras para não gerar falso positivo', () => {
    // "ai" casaria com "aí" em "vou fazer isso aí" depois de tirar o acento
    expect(deriveAliases('Mavo AI')).not.toContain('ai');
    expect(deriveAliases('Mavo AI')).toContain('mavo');
  });

  it('remove acentos', () => {
    expect(deriveAliases('Gestão Escolar')).toContain('gestao');
  });
});

describe('resolveProject — por apelido', () => {
  it('resolve quando o apelido aparece no texto', () => {
    const r = resolveProject('arrumar o bug do QR que não lê no pesqueiro', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('pesque-pague');
  });

  it('prefere o apelido mais específico sobre o mais curto', () => {
    const r = resolveProject('mavo talk tá lento demais', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('willtalk');
  });

  it('casa apelido de várias palavras', () => {
    const r = resolveProject('subir o catálogo no chat inteligente', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('mavoai');
  });

  it('ignora acento na entrada', () => {
    const r = resolveProject('o RELATÓRIO do gerenciamento tá quebrado', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('mavo-metricas');
  });
});

describe('resolveProject — por vocabulário, sem citar o nome', () => {
  it('resolve Mavo Talk falando de sessão do whatsapp', () => {
    const r = resolveProject('a sessão do whats caiu de novo', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('willtalk');
  });

  it('resolve Mavo AI falando de RAG', () => {
    const r = resolveProject('o RAG tá devolvendo lixo nas buscas', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('mavoai');
  });

  it('soma termos de vocabulário para ganhar confiança', () => {
    const r = resolveProject('o orquestrador do agente não usa o pgvector direito', TODOS);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('mavoai');
    expect(r.confidence).toBeGreaterThan(0.5);
  });
});

describe('resolveProject — ambiguidade', () => {
  it('marca como ambíguo quando "mavo" casa com os três', () => {
    const r = resolveProject('mavo tá lento', TODOS);
    expect(r.status).toBe('ambiguous');
    expect(r.candidates.map((c) => c.projectId).sort()).toEqual(
      ['mavo-metricas', 'mavoai', 'willtalk'].sort()
    );
  });

  it('não escolhe um vencedor quando está ambíguo', () => {
    const r = resolveProject('mavo tá lento', TODOS);
    expect(r.projectId).toBeUndefined();
  });
});

describe('resolveProject — desconhecido', () => {
  it('retorna unknown quando nada casa', () => {
    const r = resolveProject('comprar café e pão na padaria', TODOS);
    expect(r.status).toBe('unknown');
    expect(r.projectId).toBeUndefined();
    expect(r.confidence).toBe(0);
  });

  it('não casa apelido no meio de outra palavra', () => {
    // "talk" não pode casar dentro de "talkshow"
    const r = resolveProject('assisti um talkshow ontem', TODOS);
    expect(r.status).toBe('unknown');
  });

  it('não casa "ai" derivado dentro de "aí"', () => {
    const semAlias: ResolvableProject[] = [{ id: 'mavoai', name: 'Mavo AI' }];
    const r = resolveProject('deixa isso aí para depois', semAlias);
    expect(r.status).toBe('unknown');
  });
});

describe('resolveProject — sem apelidos cadastrados', () => {
  it('usa os apelidos derivados do nome', () => {
    const semAlias: ResolvableProject[] = [
      { id: 'willtalk', name: 'Mavo Talk' },
      { id: 'pesque-pague', name: 'WillTech Pesqueiros' },
    ];
    const r = resolveProject('o talk caiu', semAlias);
    expect(r.status).toBe('resolved');
    expect(r.projectId).toBe('willtalk');
  });
});
