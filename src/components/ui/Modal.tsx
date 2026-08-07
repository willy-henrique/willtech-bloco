import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  footer,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button, input, textarea, select, [href], [tabindex]:not([tabindex="-1"])')?.focus();
    }, 10);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Fechar modal"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden border border-border bg-bg-elevated shadow-md',
          'rounded-t-[var(--radius-xl)] sm:max-w-lg sm:rounded-[var(--radius-xl)]',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar sm:px-5">{children}</div>
        {footer ? <footer className="border-t border-border px-4 py-3 sm:px-5">{footer}</footer> : null}
      </div>
    </div>
  );
}
