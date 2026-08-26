import { describe, expect, it } from 'vitest';
import { parseBrazilianMoney } from './financeUtils';

describe('parseBrazilianMoney', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['R$ 12.500,00', 12500],
    ['99,90', 99.9],
    ['1234.56', 1234.56],
    ['0', 0],
  ])('interpreta %s como %s', (input, expected) => {
    expect(parseBrazilianMoney(input)).toBe(expected);
  });

  it('rejeita valor vazio', () => {
    expect(parseBrazilianMoney('R$ ')).toBeNaN();
  });
});
