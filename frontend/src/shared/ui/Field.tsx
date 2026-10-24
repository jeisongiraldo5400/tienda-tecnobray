import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface FieldProps {
  id: string;
  label: string;
  error?: string | false;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  /**
   * Reserva siempre la línea del mensaje (error/ayuda) para que la fila no "salte" al validar
   * y los campos vecinos sigan alineados. Por defecto activo.
   */
  reserveMessage?: boolean;
  children: ReactNode;
}

/** Envoltorio de campo: label + control + error/ayuda accesibles. */
export function Field({ id, label, error, hint, required, className, reserveMessage = true, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm leading-5 font-medium text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="min-h-4 text-xs leading-4 font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="min-h-4 text-xs leading-4 text-slate-500">
          {hint}
        </p>
      ) : reserveMessage ? (
        <span aria-hidden="true" className="block min-h-4" />
      ) : null}
    </div>
  );
}
