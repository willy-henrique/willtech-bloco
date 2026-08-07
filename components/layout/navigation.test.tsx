import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';

describe('navigation', () => {
  it('renders mobile destinations and capture CTA', () => {
    const onCapture = vi.fn();
    render(
      <MemoryRouter>
        <BottomNavigation onCapture={onCapture} />
      </MemoryRouter>
    );
    expect(screen.getByText('Hoje')).toBeInTheDocument();
    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByLabelText('Captura rápida')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('Tudo')).toBeInTheDocument();
  });

  it('renders desktop sidebar links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText('Projetos')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });
});
