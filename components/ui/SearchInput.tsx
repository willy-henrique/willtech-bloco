import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ label = 'Buscar', className = '', ...props }) => (
  <label className="relative block">
    <span className="sr-only">{label}</span>
    <Search
      size={18}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
      aria-hidden
    />
    <input
      type="search"
      className={`w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-3 text-[var(--text)] placeholder:text-[var(--muted)] ${className}`}
      {...props}
    />
  </label>
);
