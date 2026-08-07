import React from 'react';
import { cn } from '../../lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, required, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-text">
            {label}
            {required ? <span className="text-danger"> *</span> : null}
          </span>
        ) : null}
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            'min-h-28 w-full rounded-[var(--radius-md)] border bg-bg-elevated px-3 py-2.5 text-text placeholder:text-text-subtle transition duration-200',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            error ? 'border-danger' : 'border-border',
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-danger" role="alert">
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);

Textarea.displayName = 'Textarea';
