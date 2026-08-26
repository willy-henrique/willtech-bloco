import { describe, it, expect } from 'vitest';
import { ordenarPorAtividade, atividadeDe } from './ordenarPorAtividade';
import type { Project } from '../../../types';

function p(over: Partial<Project> & { name: string }): Project {
  return {
    id: over.name,
    type: 'Software',
    status: 'Active',
    progress: 0,
    color: '#fff',
    ...over,
  };
}

const nomes = (lista: Project[]) => lista.map((x) => x.name);

describe('atividadeDe', () => {
  it('soma evoluções e correções', () => {
    expect(atividadeDe(p({ name: 'x', evolucoes30d: 37, correcoes30d: 53 }))).toBe(90);
  });

  it('vale zero quando o projeto não tem dado de commit', () => {
    expect(atividadeDe(p({ name: 'x' }))).toBe(0);
  });

  it('conta mesmo se só um dos dois existir', () => {
    expect(atividadeDe(p({ name: 'x', evolucoes30d: 12 }))).toBe(12);
  });
});

describe('ordenarPorAtividade', () => {
  it('põe quem mexeu mais na frente', () => {
    const lista = [
      p({ name: 'AI', evolucoes30d: 9, correcoes30d: 25 }),
      p({ name: 'Talk', evolucoes30d: 37, correcoes30d: 53 }),
      p({ name: 'Ger', evolucoes30d: 12, correcoes30d: 0 }),
    ];
    expect(nomes(ordenarPorAtividade(lista))).toEqual(['Talk', 'AI', 'Ger']);
  });

  it('desempata pelo commit mais recente', () => {
    const lista = [
      p({ name: 'Antigo', evolucoes30d: 5, ultimoCommit: '2026-08-01' }),
      p({ name: 'Novo', evolucoes30d: 5, ultimoCommit: '2026-08-25' }),
    ];
    expect(nomes(ordenarPorAtividade(lista))).toEqual(['Novo', 'Antigo']);
  });

  it('joga para o fim quem não tem dado de commit', () => {
    const lista = [
      p({ name: 'Manual' }),
      p({ name: 'Talk', evolucoes30d: 37, correcoes30d: 53 }),
      p({ name: 'Outro Manual' }),
    ];
    expect(nomes(ordenarPorAtividade(lista))[0]).toBe('Talk');
  });

  it('ordena por nome os que não têm dado nenhum, para a lista não dançar', () => {
    const lista = [p({ name: 'Zebra' }), p({ name: 'Alfa' }), p({ name: 'Meio' })];
    expect(nomes(ordenarPorAtividade(lista))).toEqual(['Alfa', 'Meio', 'Zebra']);
  });

  it('um projeto parado mas com commit ganha de um sem dado nenhum', () => {
    const lista = [
      p({ name: 'SemDado' }),
      p({ name: 'ParadoMasReal', evolucoes30d: 0, correcoes30d: 0, ultimoCommit: '2026-03-01' }),
    ];
    expect(nomes(ordenarPorAtividade(lista))).toEqual(['ParadoMasReal', 'SemDado']);
  });

  it('não altera a lista original', () => {
    const lista = [
      p({ name: 'AI', evolucoes30d: 9 }),
      p({ name: 'Talk', evolucoes30d: 90 }),
    ];
    const copia = [...lista];
    ordenarPorAtividade(lista);
    expect(lista).toEqual(copia);
  });

  it('aguenta lista vazia', () => {
    expect(ordenarPorAtividade([])).toEqual([]);
  });
});
