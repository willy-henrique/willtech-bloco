import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from './TaskItem';
import { TaskPriority } from '../../types';

describe('TaskItem', () => {
  it('toggles completion from checkbox', () => {
    const onToggle = vi.fn();
    render(
      <TaskItem
        task={{
          id: '1',
          projectId: 'inbox',
          description: 'responder mensagem',
          priority: TaskPriority.NORMAL,
          isCompleted: false,
          createdAt: 1,
        }}
        onToggle={onToggle}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Concluir tarefa'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
