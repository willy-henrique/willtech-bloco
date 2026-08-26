import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Project } from '../../../types';
import type { CatalogoProjeto } from './tipos';

const addProject = vi.fn();
const updateProject = vi.fn();
let projects: Project[] = [];

vi.mock('../../../AppContext', () => ({
  useApp: () => ({ projects, addProject, updateProject }),
}));

// Catálogo fixo: o real tem datas que saem do recorte de 30 dias com o tempo.
// Vai dentro de vi.hoisted porque a fábrica do vi.mock é içada para o topo
// do arquivo e não enxergaria uma const declarada aqui embaixo.
const { CATALOGO_FALSO, ONTEM } = vi.hoisted(() => {
  const recente = new Date();
  recente.setDate(recente.getDate() - 2);
  const ontem = recente.toISOString().slice(0, 10);

  return {
    ONTEM: ontem,
    CATALOGO_FALSO: [
      {
        name: 'Mavo Talk',
        status: 'Active',
        type: 'Software',
        progress: 0,
        color: '#22d3ee',
        stack: 'Next.js + Supabase',
        repo: 'willy-henrique/willtalk',
        aliases: ['talk', 'willtalk'],
        vocab: ['whatsapp', 'sessao'],
        ultimoCommit: ontem,
        evolucoes30d: 37,
        correcoes30d: 53,
        historico: [],
      },
      {
        name: 'Projeto Parado',
        status: 'Legacy',
        type: 'Software',
        progress: 0,
        color: '#f59e0b',
        stack: 'React',
        repo: null,
        aliases: ['parado'],
        vocab: [],
        ultimoCommit: '2020-01-01',
        evolucoes30d: 0,
        correcoes30d: 0,
        historico: [],
      },
    ] as CatalogoProjeto[],
  };
});

vi.mock('./catalogo.seed', () => ({ CATALOGO: CATALOGO_FALSO }));

import ImportarProjetos from './ImportarProjetos';

beforeEach(() => {
  addProject.mockReset().mockResolvedValue(undefined);
  updateProject.mockReset().mockResolvedValue(undefined);
  projects = [];
});

describe('ImportarProjetos', () => {
  it('mostra o que vai criar', () => {
    render(<ImportarProjetos open onClose={vi.fn()} />);
    expect(screen.getByText('Criar (1)')).toBeInTheDocument();
    expect(screen.getByText('Mavo Talk')).toBeInTheDocument();
  });

  it('deixa de fora quem está parado há mais de 30 dias', () => {
    render(<ImportarProjetos open onClose={vi.fn()} />);
    expect(screen.queryByText('Projeto Parado')).not.toBeInTheDocument();
    expect(screen.getByText(/fora do recorte de 30 dias/i)).toBeInTheDocument();
  });

  it('cria o projeto ao confirmar', async () => {
    const user = userEvent.setup();
    render(<ImportarProjetos open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /importar 1/i }));

    await waitFor(() => expect(addProject).toHaveBeenCalledTimes(1));
    expect(addProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mavo Talk',
        aliases: ['talk', 'willtalk'],
        vocab: ['whatsapp', 'sessao'],
        repo: 'willy-henrique/willtalk',
      })
    );
    expect(updateProject).not.toHaveBeenCalled();
  });

  it('enriquece em vez de duplicar quando o projeto já existe com outro nome', async () => {
    projects = [
      { id: 'p1', name: 'WillTalk', type: 'SaaS', status: 'Active', progress: 60, color: '#ff0000' },
    ];
    const user = userEvent.setup();
    render(<ImportarProjetos open onClose={vi.fn()} />);

    expect(screen.getByText('Enriquecer (1)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /importar 1/i }));

    await waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    expect(addProject).not.toHaveBeenCalled();

    const [id, patch] = updateProject.mock.calls[0];
    expect(id).toBe('p1');
    // o que o usuário definiu fica intocado
    expect(patch).not.toHaveProperty('name');
    expect(patch).not.toHaveProperty('color');
    expect(patch).not.toHaveProperty('progress');
  });

  it('avisa quando não há nada a fazer', () => {
    projects = [
      {
        id: 'p1',
        name: 'Mavo Talk',
        type: 'SaaS',
        status: 'Active',
        progress: 60,
        color: '#ff0000',
        stack: 'Next.js + Supabase',
        repo: 'willy-henrique/willtalk',
        aliases: ['talk', 'willtalk'],
        vocab: ['whatsapp', 'sessao'],
        ultimoCommit: ONTEM,
        evolucoes30d: 37,
        correcoes30d: 53,
      },
    ];
    render(<ImportarProjetos open onClose={vi.fn()} />);

    expect(screen.getByText(/já está em dia com o catálogo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^importar$/i })).toBeDisabled();
  });

  it('relata a falha sem esconder quantos já foram gravados', async () => {
    addProject.mockRejectedValueOnce(new Error('permission-denied'));
    const user = userEvent.setup();
    render(<ImportarProjetos open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /importar 1/i }));

    expect(await screen.findByText('permission-denied')).toBeInTheDocument();
    expect(screen.getByText(/rodar de novo é seguro/i)).toBeInTheDocument();
  });
});
