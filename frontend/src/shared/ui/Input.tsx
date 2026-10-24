import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

const base =
  // text-base en móvil (16 px) evita el zoom automático de iOS; en escritorio baja a 14 px.
  'w-full min-w-0 rounded-lg border bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 transition-colors md:text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent-text disabled:bg-slate-100 disabled:text-slate-500';

function border(invalid?: boolean) {
  return invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-slate-300';
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...rest }, ref) {
  return <input ref={ref} className={cn(base, 'h-11 md:h-10', border(invalid), className)} aria-invalid={invalid || undefined} {...rest} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(base, 'py-2', border(invalid), className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cn(base, 'h-11 pr-8 md:h-10', border(invalid), className)} aria-invalid={invalid || undefined} {...rest}>
      {children}
    </select>
  );
});
