import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickCapture } from './QuickCapture';

const captureQuick = vi.fn().mockResolvedValue({ id: '1', kind: 'task' });
const toast = vi.fn();

vi.mock('../../AppContext', () => ({
  useApp: () => ({
    captureQuick,
    projects: [{ id: 'p1', name: 'Mavo Talk' }],
  }),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ toast }),
}));

describe('QuickCapture', () => {
  beforeEach(() => {
    captureQuick.mockClear();
    toast.mockClear();
  });

  it('saves on Enter without requiring type/project', async () => {
    render(<QuickCapture open onClose={() => undefined} />);
    const input = screen.getByPlaceholderText(/Digite ou fale/i);
    fireEvent.change(input, { target: { value: 'falar com Matheus amanhã' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(captureQuick).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'falar com Matheus amanhã' })
      );
    });
    expect(toast).toHaveBeenCalled();
  });
});
