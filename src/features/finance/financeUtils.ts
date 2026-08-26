export const parseBrazilianMoney = (value: string): number => {
  const sanitized = value.trim().replace(/[^\d,.-]/g, '');
  if (!sanitized) return Number.NaN;

  if (sanitized.includes(',')) {
    return Number(sanitized.replace(/\./g, '').replace(',', '.'));
  }

  return Number(sanitized);
};
