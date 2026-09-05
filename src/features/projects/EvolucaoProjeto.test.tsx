import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import EvolucaoProjeto from './EvolucaoProjeto';
import type { Project } from '../../../types';

function projeto(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Mavo Talk',
    type: 'SaaS',
    status: 'Active',
    progress: 40,
    color: '#22d3ee',
    repo: 'willy-henrique/willtalk',
    ...over,
  };
}

describe('EvolucaoProjeto — estados vazios', () => {
  it('explica quando o projeto não tem repositório', () => {
    render(<EvolucaoProjeto project={projeto({ repo: undefined })} />);
    expect(screen.getByText(/sem reposit[óo]rio vinculado/i)).toBeInTheDocument();
  });

  it('manda puxar do GitHub quando há repositório mas não há histórico', () => {
    render(<EvolucaoProjeto project={projeto()} />);
    expect(screen.getByText(/hist[óo]rico ainda n[ãa]o carregado/i)).toBeInTheDocument();
    expect(screen.getByText('willy-henrique/willtalk')).toBeInTheDocument();
  });

  it('sincroniza as atualizacoes sem obrigar o usuario a voltar ao painel', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<EvolucaoProjeto project={projeto()} onRefresh={onRefresh} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /atualizar agora/i }));
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(await screen.findByRole('status')).toHaveTextContent(/sincronizadas com o github/i);
  });

  it('explica a falha ao sincronizar as atualizacoes', async () => {
    const onRefresh = vi.fn().mockRejectedValue(new Error('Repositório privado sem acesso.'));
    render(<EvolucaoProjeto project={projeto()} onRefresh={onRefresh} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /atualizar agora/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Repositório privado sem acesso.'));
  });

  it('trata histórico vazio igual a histórico ausente', () => {
    render(<EvolucaoProjeto project={projeto({ historico: [] })} />);
    expect(screen.getByText(/hist[óo]rico ainda n[ãa]o carregado/i)).toBeInTheDocument();
  });
});

describe('EvolucaoProjeto — linha do tempo', () => {
  const comHistorico = projeto({
    evolucoes30d: 37,
    correcoes30d: 53,
    ultimoCommit: '2026-08-25',
    historico: [
      { data: '2026-08-25', tipo: 'evoluiu', assunto: 'presenca da equipe' },
      { data: '2026-08-25', tipo: 'corrigiu', assunto: 'revoga sessao' },
      { data: '2026-08-20', tipo: 'melhorou', assunto: 'quebra o componente' },
    ],
  });

  it('mostra os números de atividade', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
  });

  it('lista todos os commits do histórico', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    expect(screen.getByText('presenca da equipe')).toBeInTheDocument();
    expect(screen.getByText('revoga sessao')).toBeInTheDocument();
    expect(screen.getByText('quebra o componente')).toBeInTheDocument();
  });

  it('traduz o tipo do commit para linguagem de painel', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    expect(screen.getByText('Evoluiu')).toBeInTheDocument();
    expect(screen.getByText('Corrigiu')).toBeInTheDocument();
    expect(screen.getByText('Melhorou')).toBeInTheDocument();
  });

  it('agrupa por dia em vez de repetir a data em cada commit', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    const linha = within(screen.getByRole('list', { name: /linha do tempo/i }));
    // dois commits no dia 25, mas o cabecalho do dia aparece uma vez so
    expect(linha.getAllByText(/25 de agosto/i)).toHaveLength(1);
  });

  it('poe o dia mais recente no topo', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    const linha = within(screen.getByRole('list', { name: /linha do tempo/i }));
    const dias = linha.getAllByText(/de agosto/i).map((n) => n.textContent ?? '');
    expect(dias[0]).toMatch(/25/);
    expect(dias[1]).toMatch(/20/);
  });

  it('leva para os commits no GitHub', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    const link = screen.getByRole('link', { name: /ver no github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/willy-henrique/willtalk/commits');
  });

  it('abre o GitHub sem expor a janela de origem', () => {
    render(<EvolucaoProjeto project={comHistorico} />);
    const link = screen.getByRole('link', { name: /ver no github/i });
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
