const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatBRL(value: number): string {
  return BRL_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

export function parseBRLInput(value: string): number {
  const normalized = value
    .replace(/[^\d,-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
