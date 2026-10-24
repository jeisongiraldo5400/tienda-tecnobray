'use client';

import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/cn';
import { useModalBehavior } from './useModalBehavior';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** `bottom`: hoja inferior en móvil que se convierte en panel lateral izquierdo desde md. */
  side?: 'left' | 'right' | 'bottom';
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, side = 'right', children, footer }: DrawerProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useModalBehavior(open, onClose, containerRef, panelRef);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div ref={containerRef} className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute flex w-full flex-col bg-white shadow-2xl focus:outline-none',
          side === 'bottom'
            ? 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl md:inset-x-auto md:top-0 md:left-0 md:h-dvh md:max-h-none md:max-w-md md:rounded-none'
            : cn('top-0 h-dvh max-w-md', side === 'right' ? 'right-0' : 'left-0'),
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer ? <div className="pb-safe border-t border-slate-100 px-5 pt-4">{footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}
