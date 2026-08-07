import { describe, expect, it } from 'vitest';
import { executeAiTool } from '../src/ai/tools/registry';

describe('ai tool execution', () => {
  it('rejects unknown tools', async () => {
    const result = await executeAiTool('unknown', {}, { userId: 'u1', conversationId: 'c1', requestId: 'r1' }, {});
    expect(result.ok).toBe(false);
  });

  it('rejects missing user', async () => {
    const result = await executeAiTool(
      'summarize_day',
      {},
      { userId: '', conversationId: 'c1', requestId: 'r1' },
      {
        summarize_day: async () => ({ ok: true, data: {} }),
      },
    );
    expect(result.ok).toBe(false);
  });

  it('runs registered deterministic handler', async () => {
    const result = await executeAiTool(
      'summarize_day',
      {},
      { userId: 'u1', conversationId: 'c1', requestId: 'r1' },
      {
        summarize_day: async () => ({ ok: true, data: { tasks: 2 } }),
      },
    );
    expect(result).toEqual({ ok: true, data: { tasks: 2 } });
  });
});
