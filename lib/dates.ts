const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  const da = startOfDay(new Date(a));
  const db = startOfDay(new Date(b));
  return da.getTime() === db.getTime();
}

export function isToday(ts: number): boolean {
  return isSameDay(ts, Date.now());
}

export function isTomorrow(ts: number): boolean {
  return isSameDay(ts, addDays(new Date(), 1));
}

export function isThisWeek(ts: number): boolean {
  const now = startOfDay();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = addDays(now, mondayOffset);
  const weekEnd = endOfDay(addDays(weekStart, 6));
  return ts >= weekStart.getTime() && ts <= weekEnd.getTime();
}

export function greetingForHour(hour: number = new Date().getHours()): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatShortDate(ts: number): string {
  if (isToday(ts)) return 'Hoje';
  if (isTomorrow(ts)) return 'Amanhã';
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function todayAt(hours: number, minutes = 0): number {
  const d = startOfDay();
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

export function tomorrowAt(hours: number, minutes = 0): number {
  const d = startOfDay(addDays(new Date(), 1));
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

export { DAY_MS };
