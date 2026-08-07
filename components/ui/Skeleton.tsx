import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-2)] ${className}`}
    aria-hidden
  />
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3" role="status" aria-label="Carregando">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
);
