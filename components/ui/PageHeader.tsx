import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <header className="mb-5 flex items-start justify-between gap-4">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </header>
);
