import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    <p className="font-display text-lg text-[var(--text)]">{title}</p>
    {description && <p className="max-w-sm text-sm text-[var(--muted)]">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
