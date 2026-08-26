import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const service = () => ({
    getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  });
  return {
    projectsService: service(), tasksService: service(), snippetsService: service(),
    vaultService: service(), deadlinesService: service(),
  };
});

vi.mock('./config/firebase', () => ({}));
vi.mock('./services/firestoreService', () => mocks);

import { AppProvider, useApp } from '../AppContext';

const Probe = () => {
  const app = useApp();
  return <div>
    <span data-testid="loading">{String(app.isLoading)}</span>
    <span data-testid="counts">{[app.projects.length, app.tasks.length, app.snippets.length, app.deadlines.length].join('/')}</span>
    <span data-testid="error">{app.dataError || 'ok'}</span>
    <button onClick={() => void app.addSnippet({ title: 'Query', code: 'select 1', language: 'sql' })}>add snippet</button>
    <button onClick={() => void app.deleteSnippet('s1')}>delete snippet</button>
    <button onClick={() => void app.addDeadline({ title: 'Entrega', date: '2026-09-01', projectId: 'p1', type: 'Sprint' })}>add deadline</button>
    <button onClick={() => void app.updateDeadline('d1', { title: 'Entrega final' })}>update deadline</button>
    <button onClick={() => void app.deleteDeadline('d1')}>delete deadline</button>
  </div>;
};

beforeEach(() => {
  localStorage.clear();
  Object.values(mocks).forEach((service) => {
    service.getAll.mockReset().mockResolvedValue([]);
    service.create.mockReset().mockResolvedValue('new-id');
    service.update.mockReset().mockResolvedValue(undefined);
    service.delete.mockReset().mockResolvedValue(undefined);
    service.subscribe.mockReset().mockReturnValue(vi.fn());
  });
});

describe('AppProvider', () => {
  it('mantem colecoes realmente vazias sem recriar exemplos', async () => {
    render(<AppProvider><Probe /></AppProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('counts')).toHaveTextContent('0/0/0/0');
    expect(mocks.projectsService.create).not.toHaveBeenCalled();
    expect(mocks.snippetsService.create).not.toHaveBeenCalled();
  });

  it('usa cache e avisa quando uma colecao falha', async () => {
    localStorage.setItem('wt_tasks', JSON.stringify([{ id: 'cached', description: 'offline' }]));
    mocks.tasksService.getAll.mockRejectedValue(new Error('offline'));
    render(<AppProvider><Probe /></AppProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('counts')).toHaveTextContent('0/1/0/0');
    expect(screen.getByTestId('error')).toHaveTextContent(/tasks/i);
  });

  it('liga as acoes de snippets e agenda aos servicos', async () => {
    const user = userEvent.setup();
    render(<AppProvider><Probe /></AppProvider>);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    await user.click(screen.getByText('add snippet'));
    await user.click(screen.getByText('delete snippet'));
    await user.click(screen.getByText('add deadline'));
    await user.click(screen.getByText('update deadline'));
    await user.click(screen.getByText('delete deadline'));
    expect(mocks.snippetsService.create).toHaveBeenCalledWith({ title: 'Query', code: 'select 1', language: 'sql' });
    expect(mocks.snippetsService.delete).toHaveBeenCalledWith('s1');
    expect(mocks.deadlinesService.create).toHaveBeenCalled();
    expect(mocks.deadlinesService.update).toHaveBeenCalledWith('d1', { title: 'Entrega final' });
    expect(mocks.deadlinesService.delete).toHaveBeenCalledWith('d1');
  });
});
