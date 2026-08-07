import React from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, required, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-text">
            {label}
            {required ? <span className="text-danger"> *</span> : null}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-11 w-full rounded-[var(--radius-md)] border bg-bg-elevated px-3 text-text placeholder:text-text-subtle transition duration-200',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            error ? 'border-danger' : 'border-border',
            className,
          )}
          {...props}
        />
        {error ? (
          <span id={`${inputId}-error`} className="text-xs text-danger" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className="text-xs text-text-subtle">
            {hint}
          </span>
        ) : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
