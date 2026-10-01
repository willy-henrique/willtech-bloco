import { describe, expect, it } from 'vitest';
import { agregarContas, estatisticasInfra } from './agregarInfra';
import type { Project } from '../../../types';

const projeto = (id: string, name: string, platforms?: Project['platforms'], endpoints?: Project['endpoints']): Project =>
  ({ id, name, type: 'Software', status: 'Active', progress: 0, color: '#000', platforms, endpoints });

describe('agregarContas', () => {
  it('agrupa contas por plataforma e email', () => {
    const contas = agregarContas([
      projeto('a', 'App A', [
        { id: '1', platform: 'vercel', email: 'willydev01@gmail.com' },
        { id: '2', platform: 'github', email: 'willydev01@gmail.com' },
      ]),
      projeto('b', 'App B', [
        { id: '3', platform: 'vercel', email: 'willydev01@gmail.com' },
        { id: '4', platform: 'render', email: 'cardosorocha@gmail.com' },
      ]),
    ]);
    expect(contas).toHaveLength(3);
    const vercel = contas.find((c) => c.platform === 'vercel');
    expect(vercel?.projetos.map((p) => p.name).sort()).toEqual(['App A', 'App B']);
    const render = contas.find((c) => c.platform === 'render');
    expect(render?.email).toBe('cardosorocha@gmail.com');
  });

  it('não duplica projeto na mesma conta e ignora email vazio', () => {
    const contas = agregarContas([
      projeto('a', 'App A', [
        { id: '1', platform: 'github', email: 'eu@x.com' },
        { id: '2', platform: 'github', email: 'eu@x.com' },
        { id: '3', platform: 'vercel', email: '' },
      ]),
    ]);
    expect(contas).toHaveLength(1);
    expect(contas[0].projetos).toHaveLength(1);
  });
});

describe('estatisticasInfra', () => {
  it('calcula contadores', () => {
    const stats = estatisticasInfra([
      projeto('a', 'App A', [{ id: '1', platform: 'github', email: 'eu@x.com' }], [{ id: 'e1', label: 'API', url: 'https://x' }]),
      projeto('b', 'App B'),
    ]);
    expect(stats).toEqual({ projetos: 2, comInfra: 1, contas: 1, emailsUnicos: 1, endpoints: 1 });
  });
});
