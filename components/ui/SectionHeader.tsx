import React from 'react';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h2 className="section-title">{title}</h2>
    {action}
  </div>
);
