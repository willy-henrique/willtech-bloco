import { describe, expect, it } from 'vitest';
import { greetingForHour, isOverdue, toDateKey } from '../src/lib/dates';

describe('dates', () => {
  it('returns contextual greeting', () => {
    expect(greetingForHour(8)).toBe('Bom dia');
    expect(greetingForHour(15)).toBe('Boa tarde');
    expect(greetingForHour(21)).toBe('Boa noite');
  });

  it('detects overdue dates', () => {
    expect(isOverdue('2000-01-01', false)).toBe(true);
    expect(isOverdue('2000-01-01', true)).toBe(false);
    expect(isOverdue(toDateKey(), false)).toBe(false);
  });
});
