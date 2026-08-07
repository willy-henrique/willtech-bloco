import React from 'react';
import { cn } from '../../lib/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, required, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <label className="flex w-full flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-text">
            {label}
            {required ? <span className="text-danger"> *</span> : null}
          </span>
        ) : null}
        <select
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            'h-11 w-full rounded-[var(--radius-md)] border bg-bg-elevated px-3 text-text transition duration-200',
            'focus:border-accent focus:ring-2 focus:ring-accent/20',
            error ? 'border-danger' : 'border-border',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-xs text-danger" role="alert">
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);

Select.displayName = 'Select';
