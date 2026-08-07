import React from 'react';
import { cn } from '../../lib/cn';

const tones = {
  default: 'bg-bg-muted text-text-muted border-border',
  accent: 'bg-accent-soft text-accent border-accent/20',
  danger: 'bg-red-500/10 text-danger border-red-500/20',
  warning: 'bg-amber-500/10 text-warning border-amber-500/20',
  success: 'bg-emerald-500/10 text-success border-emerald-500/20',
  info: 'bg-sky-500/10 text-info border-sky-500/20',
} as const;

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
