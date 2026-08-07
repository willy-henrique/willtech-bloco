import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg hover:brightness-110 active:brightness-95 shadow-sm',
  secondary:
    'bg-surface-hover text-text hover:bg-bg-muted border border-border',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text',
  danger: 'bg-danger text-white hover:brightness-110',
  outline: 'border border-border bg-transparent hover:bg-surface-hover text-text',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-11 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-12 px-5 text-base gap-2 rounded-[var(--radius-md)]',
  icon: 'h-11 w-11 rounded-[var(--radius-md)]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition duration-200 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
