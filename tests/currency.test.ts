import { describe, expect, it } from 'vitest';
import { formatBRL, parseBRLInput } from '../src/lib/currency';

describe('currency', () => {
  it('formats BRL in pt-BR', () => {
    expect(formatBRL(1234.5)).toMatch(/R\$/);
    expect(formatBRL(1234.5)).toContain('1.234,50');
  });

  it('parses Brazilian currency input', () => {
    expect(parseBRLInput('1.234,56')).toBeCloseTo(1234.56);
    expect(parseBRLInput('abc')).toBe(0);
  });
});
