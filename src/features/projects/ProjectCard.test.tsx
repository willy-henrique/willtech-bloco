import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../types';

const getByProjectId = vi.hoisted(() => vi.fn());
vi.mock('../../services/firestoreService', () => ({ projectPaymentsService: { getByProjectId } }));

import ProjectCard from '../../../components/ProjectCard';

const project: Project = { id: 'p1', name: 'Portal', type: 'SaaS', status: 'Active', progress: 50, color: '#22c55e' };
const payment = { id: 'pay1', projectId: 'p1', title: 'Mensalidade', dueDate: '2026-08-01', amount: 100, status: 'pending' as const, createdAt: 1 };

beforeEach(() => getByProjectId.mockReset().mockResolvedValue([]));

describe('ProjectCard', () => {
  it('usa pagamentos carregados pelo painel sem repetir consulta', () => {
    render(<ProjectCard project={project} tasks={[]} payments={[payment]} />);
    expect(screen.getByText(/Mensalidade requer atenção/i)).toBeInTheDocument();
    expect(getByProjectId).not.toHaveBeenCalled();
  });

  it('mantem fallback de consulta quando usado isoladamente', async () => {
    getByProjectId.mockResolvedValue([payment]);
    render(<ProjectCard project={project} tasks={[]} />);
    expect(await screen.findByText(/Mensalidade requer atenção/i)).toBeInTheDocument();
    expect(getByProjectId).toHaveBeenCalledWith('p1');
  });

  it('editar nao abre o projeto por acidente', async () => {
    const onOpen = vi.fn();
    const onEdit = vi.fn();
    render(<ProjectCard project={project} tasks={[]} payments={[]} onOpen={onOpen} onEdit={onEdit} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Editar Portal' }));
    expect(onEdit).toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
