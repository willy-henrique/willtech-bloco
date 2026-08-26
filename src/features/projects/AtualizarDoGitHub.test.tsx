import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Project } from '../../../types';

const updateProject = vi.fn();
let projects: Project[] = [];

vi.mock('../../../AppContext', () => ({
  useApp: () => ({ projects, updateProject }),
}));

import AtualizarDoGitHub from './AtualizarDoGitHub';

const fetchFalso = vi.fn();

function projeto(over: Partial<Project> & { id: string }): Project {
  return {
    name: over.id,
    type: 'SaaS',
    status: 'Active',
    progress: 0,
    color: '#fff',
    ...over,
  };
}

const respostaOk = (corpo: unknown) => ({ ok: true, status: 200, json: async () => corpo });

beforeEach(() => {
  updateProject.mockReset().mockResolvedValue(undefined);
  fetchFalso.mockReset();
  vi.stubGlobal('fetch', fetchFalso);
  projects = [
    projeto({ id: 'talk', name: 'Mavo Talk', repo: 'willy/willtalk' }),
    projeto({ id: 'ai', name: 'Mavo AI', repo: 'willy/mavoai' }),
    projeto({ id: 'manual', name: 'Feito a mao' }),
  ];
});

afterEach(() => vi.unstubAllGlobals());

describe('AtualizarDoGitHub', () => {
  it('só envia projetos que têm repositório', async () => {
    render(<AtualizarDoGitHub />);
    fetchFalso.mockResolvedValue(respostaOk({ resultados: [] }));
    await userEvent.setup().click(screen.getByRole('button', { name: /github/i }));

    await waitFor(() => expect(fetchFalso).toHaveBeenCalled());
    const corpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(corpo.repos).toEqual(['willy/willtalk', 'willy/mavoai']);
  });

  it('grava a atividade recebida em cada projeto', async () => {
    render(<AtualizarDoGitHub />);
    fetchFalso.mockResolvedValue(
      respostaOk({
        resultados: [
          {
            repo: 'willy/willtalk',
            ok: true,
            ultimoCommit: '2026-08-25',
            evolucoes30d: 37,
            correcoes30d: 53,
            historico: [{ data: '2026-08-25', tipo: 'evoluiu', assunto: 'x' }],
          },
        ],
      })
    );

    await userEvent.setup().click(screen.getByRole('button', { name: /github/i }));

    await waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    expect(updateProject).toHaveBeenCalledWith('talk', {
      ultimoCommit: '2026-08-25',
      evolucoes30d: 37,
      correcoes30d: 53,
      historico: [{ data: '2026-08-25', tipo: 'evoluiu', assunto: 'x' }],
    });
  });

  it('grava os que deram certo mesmo quando outro falha', async () => {
    render(<AtualizarDoGitHub />);
    fetchFalso.mockResolvedValue(
      respostaOk({
        resultados: [
          { repo: 'willy/willtalk', ok: true, ultimoCommit: '2026-08-25', evolucoes30d: 1, correcoes30d: 0, historico: [] },
          { repo: 'willy/mavoai', ok: false, erro: 'Repositório é privado.' },
        ],
      })
    );

    await userEvent.setup().click(screen.getByRole('button', { name: /github/i }));

    await waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/1 atualizados, 1 falharam/i)).toBeInTheDocument();
    expect(screen.getByText('Repositório é privado.')).toBeInTheDocument();
  });

  it('avisa quando nenhum projeto tem repositório', async () => {
    projects = [projeto({ id: 'manual', name: 'Feito a mao' })];
    render(<AtualizarDoGitHub />);
    await userEvent.setup().click(screen.getByRole('button', { name: /github/i }));

    expect(await screen.findByText(/nenhum projeto tem reposit[óo]rio/i)).toBeInTheDocument();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('mostra o erro quando a função responde falha', async () => {
    render(<AtualizarDoGitHub />);
    fetchFalso.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ erro: 'Token do GitHub inválido.' }),
    });

    await userEvent.setup().click(screen.getByRole('button', { name: /github/i }));
    expect(await screen.findByText('Token do GitHub inválido.')).toBeInTheDocument();
  });

  it('não quebra quando a rede cai', async () => {
    render(<AtualizarDoGitHub />);
    fetchFalso.mockRejectedValue(new Error('Failed to fetch'));
    await userEvent.setup().click(screen.getByRole('button', { name: /github/i }));
    expect(await screen.findByText('Failed to fetch')).toBeInTheDocument();
  });
});

