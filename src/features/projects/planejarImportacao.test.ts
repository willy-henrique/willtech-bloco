import { describe, it, expect } from 'vitest';
import { planejarImportacao } from './planejarImportacao';
import type { CatalogoProjeto } from './tipos';
import type { Project } from '../../../types';

const HOJE = new Date('2026-08-26T12:00:00Z');

function doCatalogo(over: Partial<CatalogoProjeto> = {}): CatalogoProjeto {
  return {
    name: 'Mavo Talk',
    status: 'Active',
    type: 'Software',
    progress: 0,
    color: '#22d3ee',
    stack: 'Next.js + Supabase',
    repo: 'willy-henrique/willtalk',
    aliases: ['mavo', 'mavo talk', 'talk', 'willtalk'],
    vocab: ['whatsapp', 'sessao', 'atendente'],
    ultimoCommit: '2026-08-25',
    evolucoes30d: 37,
    correcoes30d: 53,
    historico: [],
    ...over,
  };
}

function existente(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Mavo Talk',
    type: 'SaaS',
    status: 'Active',
    progress: 60,
    color: '#ff0000',
    ...over,
  };
}

describe('planejarImportacao — recorte de 30 dias', () => {
  it('inclui projeto com commit dentro dos 30 dias', () => {
    const plano = planejarImportacao([doCatalogo()], [], HOJE);
    expect(plano.criar).toHaveLength(1);
  });

  it('deixa de fora projeto parado há mais de 30 dias', () => {
    const plano = planejarImportacao([doCatalogo({ ultimoCommit: '2026-05-01' })], [], HOJE);
    expect(plano.criar).toHaveLength(0);
    expect(plano.foraDoRecorte).toHaveLength(1);
    expect(plano.foraDoRecorte[0].motivo).toMatch(/2026-05-01/);
  });

  it('inclui projeto no limite exato de 30 dias', () => {
    const plano = planejarImportacao([doCatalogo({ ultimoCommit: '2026-07-27' })], [], HOJE);
    expect(plano.criar).toHaveLength(1);
  });
});

describe('planejarImportacao — nunca remove', () => {
  it('não devolve nada para apagar mesmo com projeto fora do catálogo', () => {
    const plano = planejarImportacao([doCatalogo()], [existente({ name: 'Naturize' })], HOJE);
    expect(plano).not.toHaveProperty('remover');
    expect(plano.criar).toHaveLength(1);
    expect(plano.atualizar).toHaveLength(0);
  });
});

describe('planejarImportacao — casamento com o que já existe', () => {
  it('casa pelo nome, ignorando caixa e acento', () => {
    const plano = planejarImportacao([doCatalogo()], [existente({ name: 'mavo talk' })], HOJE);
    expect(plano.criar).toHaveLength(0);
    expect(plano.atualizar).toHaveLength(1);
  });

  it('casa quando o nome cadastrado é um apelido do catálogo', () => {
    // no painel está "WillTalk"; no catálogo o nome é "Mavo Talk"
    const plano = planejarImportacao([doCatalogo()], [existente({ name: 'WillTalk' })], HOJE);
    expect(plano.criar).toHaveLength(0);
    expect(plano.atualizar[0].existente.name).toBe('WillTalk');
  });

  it('cria quando não casa com nada', () => {
    const plano = planejarImportacao([doCatalogo()], [existente({ name: 'Naturize' })], HOJE);
    expect(plano.criar).toHaveLength(1);
  });

  it('casa quando o apelido aparece DENTRO do nome cadastrado', () => {
    // no painel: "projeto do jeferson agrorafia" / no catálogo: "WillTech ERP"
    const erp = doCatalogo({ name: 'WillTech ERP', aliases: ['erp', 'agrorafia'] });
    const plano = planejarImportacao(
      [erp],
      [existente({ name: 'projeto do jeferson agrorafia' })],
      HOJE
    );
    expect(plano.criar).toHaveLength(0);
    expect(plano.atualizar[0].existente.name).toBe('projeto do jeferson agrorafia');
  });

  it('não casa por apelido curto, que geraria falso positivo', () => {
    // "chat" dentro de "Chat do Cliente" não pode reivindicar o Mavo AI
    const ai = doCatalogo({ name: 'Mavo AI', aliases: ['chat', 'mavoai'] });
    const plano = planejarImportacao([ai], [existente({ name: 'Chat do Cliente' })], HOJE);
    expect(plano.criar).toHaveLength(1);
    expect(plano.atualizar).toHaveLength(0);
  });

  it('não deixa dois projetos do catálogo reivindicarem o mesmo card', () => {
    const a = doCatalogo({ name: 'Mavo Talk', aliases: ['mavotalk'] });
    const b = doCatalogo({ name: 'Mavo Talk Local', aliases: ['mavotalk'] });
    const plano = planejarImportacao([a, b], [existente({ name: 'meu mavotalk' })], HOJE);
    expect(plano.atualizar).toHaveLength(1);
    expect(plano.criar).toHaveLength(1);
  });

  it('prefere o casamento exato ao casamento por trecho', () => {
    const porTrecho = doCatalogo({ name: 'Outro', aliases: ['mavotalk'] });
    const exato = doCatalogo({ name: 'meu mavotalk', aliases: [] });
    const plano = planejarImportacao([porTrecho, exato], [existente({ name: 'meu mavotalk' })], HOJE);
    expect(plano.atualizar[0].doCatalogo.name).toBe('meu mavotalk');
  });
});

describe('planejarImportacao — atividade', () => {
  it('grava a atividade ao criar', () => {
    const plano = planejarImportacao([doCatalogo()], [], HOJE);
    expect(plano.criar[0].evolucoes30d).toBe(37);
    expect(plano.criar[0].correcoes30d).toBe(53);
  });

  it('sempre atualiza a atividade, porque é derivada e não escrita à mão', () => {
    const desatualizado = existente({
      aliases: ['mavo', 'mavo talk', 'talk', 'willtalk'],
      vocab: ['whatsapp', 'sessao', 'atendente'],
      stack: 'Next.js + Supabase',
      repo: 'willy-henrique/willtalk',
      evolucoes30d: 2,
      correcoes30d: 1,
      ultimoCommit: '2026-08-01',
    });
    const plano = planejarImportacao([doCatalogo()], [desatualizado], HOJE);
    expect(plano.atualizar[0].patch.evolucoes30d).toBe(37);
    expect(plano.atualizar[0].patch.correcoes30d).toBe(53);
    expect(plano.atualizar[0].patch.ultimoCommit).toBe('2026-08-25');
  });

  it('não marca mudança quando a atividade já está igual', () => {
    const emDia = existente({
      aliases: ['mavo', 'mavo talk', 'talk', 'willtalk'],
      vocab: ['whatsapp', 'sessao', 'atendente'],
      stack: 'Next.js + Supabase',
      repo: 'willy-henrique/willtalk',
      evolucoes30d: 37,
      correcoes30d: 53,
      ultimoCommit: '2026-08-25',
    });
    const plano = planejarImportacao([doCatalogo()], [emDia], HOJE);
    expect(plano.atualizar).toHaveLength(0);
    expect(plano.semMudanca).toHaveLength(1);
  });
});

describe('planejarImportacao — o que muda no que já existe', () => {
  it('preserva nome, cor e progresso que o usuário definiu', () => {
    const plano = planejarImportacao(
      [doCatalogo()],
      [existente({ name: 'WillTalk', color: '#ff0000', progress: 60 })],
      HOJE
    );
    const patch = plano.atualizar[0].patch;
    expect(patch).not.toHaveProperty('name');
    expect(patch).not.toHaveProperty('color');
    expect(patch).not.toHaveProperty('progress');
  });

  it('preserva o status que o usuário definiu', () => {
    const plano = planejarImportacao(
      [doCatalogo()],
      [existente({ status: 'Maintenance' })],
      HOJE
    );
    expect(plano.atualizar[0].patch).not.toHaveProperty('status');
  });

  it('soma apelidos sem perder os que já estavam lá', () => {
    const plano = planejarImportacao(
      [doCatalogo()],
      [existente({ aliases: ['apelido-meu'] })],
      HOJE
    );
    const aliases = plano.atualizar[0].patch.aliases!;
    expect(aliases).toContain('apelido-meu');
    expect(aliases).toContain('talk');
    expect(new Set(aliases).size).toBe(aliases.length);
  });

  it('soma vocabulário sem duplicar', () => {
    const plano = planejarImportacao(
      [doCatalogo()],
      [existente({ vocab: ['whatsapp', 'meu-termo'] })],
      HOJE
    );
    const vocab = plano.atualizar[0].patch.vocab!;
    expect(vocab).toContain('meu-termo');
    expect(vocab.filter((v) => v === 'whatsapp')).toHaveLength(1);
  });

  it('preenche a stack quando está vazia', () => {
    const plano = planejarImportacao([doCatalogo()], [existente({ stack: undefined })], HOJE);
    expect(plano.atualizar[0].patch.stack).toBe('Next.js + Supabase');
  });

  it('não sobrescreve a stack que o usuário escreveu', () => {
    const plano = planejarImportacao([doCatalogo()], [existente({ stack: 'Minha Stack' })], HOJE);
    expect(plano.atualizar[0].patch).not.toHaveProperty('stack');
  });

  it('descreve em português o que vai mudar', () => {
    const plano = planejarImportacao([doCatalogo()], [existente({ stack: undefined })], HOJE);
    expect(plano.atualizar[0].mudancas.join(' ')).toMatch(/apelido|vocabul|stack/i);
  });

  // O caso "nada a mudar" é coberto por
  // 'não marca mudança quando a atividade já está igual', no bloco de atividade.
});
