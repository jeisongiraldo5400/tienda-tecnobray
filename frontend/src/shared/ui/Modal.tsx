'use client';

import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';
import { useModalBehavior } from './useModalBehavior';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  // Foco inicial: primer campo o acción (no el botón de cerrar).
  useModalBehavior(
    open,
    onClose,
    containerRef,
    panelRef,
    'input:not([disabled]), select, textarea, button:not([data-close]):not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  );

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-stretch justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          // Pantalla completa en teléfonos; diálogo centrado desde sm.
          'relative flex w-full flex-col bg-white shadow-xl focus:outline-none sm:h-auto sm:max-h-[90vh] sm:self-center sm:rounded-2xl',
          // Las confirmaciones cortas (sm) son hoja inferior; los formularios ocupan toda la pantalla.
          size === 'sm' ? 'max-h-[92dvh] self-end rounded-t-2xl' : 'h-dvh',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3 sm:py-4">
          <div className="min-w-0 pt-2 sm:pt-0">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            data-close
            onClick={onClose}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 sm:h-9 sm:w-9"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="pb-safe flex flex-col-reverse gap-2 border-t border-slate-100 px-5 pt-3 sm:flex-row sm:justify-end sm:pb-3 [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
