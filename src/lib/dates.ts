const TIMEZONE = 'America/Sao_Paulo';

export function nowInSaoPaulo(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

export function toDateKey(date: Date | string | number = new Date()): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, ...options }).format(d);
}

export function formatTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatDateTime(date: Date | string | number): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

export function greetingForHour(hour = nowInSaoPaulo().getHours()): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function isOverdue(dateKey?: string | null, completed = false): boolean {
  if (!dateKey || completed) return false;
  return dateKey < toDateKey();
}

export function startOfWeek(date = nowInSaoPaulo(), weekStartsOn: 0 | 1 = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = weekStartsOn === 1 ? (day === 0 ? -6 : 1 - day) : -day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export { TIMEZONE };
