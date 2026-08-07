import React from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'soft';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-[var(--primary)] text-white dark:text-[#0f1412] hover:opacity-90',
  soft: 'bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-90',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${styles[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
