import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskPriority, type Project } from '../../../types';

const addTask = vi.fn();
const projects: Project[] = [
  {
    id: 'willtalk',
    name: 'Mavo Talk',
    type: 'SaaS',
    status: 'Active',
    progress: 60,
    color: '#22d3ee',
    vocab: ['whatsapp', 'sessao', 'fila'],
  },
  {
    id: 'mavoai',
    name: 'Mavo AI',
    type: 'SaaS',
    status: 'Active',
    progress: 80,
    color: '#a78bfa',
    vocab: ['rag', 'pgvector'],
  },
  {
    id: 'mavo-metricas',
    name: 'Mavo Gerenciamento',
    type: 'Painel',
    status: 'Active',
    progress: 30,
    color: '#f59e0b',
  },
];

vi.mock('../../../AppContext', () => ({ useApp: () => ({ projects, addTask }) }));

import CaptureChat from './CaptureChat';

// jsdom não implementa scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  addTask.mockReset();
  addTask.mockResolvedValue(undefined);
});

async function digitar(texto: string) {
  const { default: userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  const campo = screen.getByLabelText('O que precisa ser feito?');
  await user.type(campo, texto);
  await user.click(screen.getByLabelText('Enviar'));
  return user;
}

describe('CaptureChat', () => {
  it('não renderiza nada quando fechado', () => {
    render(<CaptureChat open={false} onClose={vi.fn()} />);
    expect(screen.queryByLabelText('O que precisa ser feito?')).not.toBeInTheDocument();
  });

  it('salva no projeto certo reconhecido pelo vocabulário', async () => {
    render(<CaptureChat open onClose={vi.fn()} />);
    await digitar('a sessão do whats caiu de novo');

    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
    expect(addTask).toHaveBeenCalledWith(
      'willtalk',
      'a sessão do whats caiu de novo',
      TaskPriority.NORMAL
    );
  });

  it('extrai a prioridade do texto', async () => {
    render(<CaptureChat open onClose={vi.fn()} />);
    await digitar('o RAG tá devolvendo lixo, urgente');

    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
    expect(addTask).toHaveBeenCalledWith('mavoai', 'o RAG tá devolvendo lixo', TaskPriority.URGENT);
  });

  it('confirma na tela em qual projeto salvou', async () => {
    render(<CaptureChat open onClose={vi.fn()} />);
    await digitar('o RAG tá lento, urgente');

    expect(await screen.findByText('Mavo AI')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('pergunta em vez de chutar quando fica ambíguo', async () => {
    render(<CaptureChat open onClose={vi.fn()} />);
    await digitar('mavo tá lento');

    expect(await screen.findByText(/não sei qual dos dois/i)).toBeInTheDocument();
    expect(addTask).not.toHaveBeenCalled();

    // os três Mavo aparecem como opção
    expect(screen.getByRole('button', { name: 'Mavo Talk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mavo AI' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mavo Gerenciamento' })).toBeInTheDocument();
  });

  it('salva no projeto escolhido depois da pergunta', async () => {
    render(<CaptureChat open onClose={vi.fn()} />);
    const user = await digitar('mavo tá lento');

    await user.click(await screen.findByRole('button', { name: 'Mavo Talk' }));

    await waitFor(() => expect(addTask).toHaveBeenCalledTimes(1));
    expect(addTask).toHaveBeenCalledWith('willtalk', 'mavo tá lento', TaskPriority.NORMAL);
  });

  it('oferece todos os projetos quando não reconhece nenhum', async () => {
    render(<CaptureChat open onClose={vi.fn()} />);
    await digitar('comprar café na padaria');

    expect(await screen.findByText(/não reconheci o projeto/i)).toBeInTheDocument();
    expect(addTask).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Mavo Gerenciamento' })).toBeInTheDocument();
  });
});
