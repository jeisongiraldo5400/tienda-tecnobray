import { AlertTriangle, Inbox } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Spinner } from './Spinner';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description ? <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'No pudimos cargar la información',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 px-6 py-10 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="min-h-11 px-3 text-sm font-semibold text-brand hover:underline">
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Cargando…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-12 text-sm text-slate-500', className)}>
      <Spinner label={label} />
      <span aria-hidden="true">{label}</span>
    </div>
  );
}
