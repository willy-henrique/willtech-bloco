import React from 'react';
import { cn } from '../../lib/cn';

export function Tooltip({
  label,
  children,
  side = 'right',
}: {
  label: string;
  children: React.ReactNode;
  side?: 'right' | 'top';
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text opacity-0 shadow-sm transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'right' && 'left-full top-1/2 ml-2 -translate-y-1/2',
          side === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
        )}
      >
        {label}
      </span>
    </span>
  );
}
