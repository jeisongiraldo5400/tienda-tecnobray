import { Check, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatDateTime } from '@/shared/lib/format';
import type { Order } from '@/shared/types/domain';
import { ORDER_STATUS_LABELS, TRACKING_STEPS } from '../adapters/order.adapter';

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'cancelado') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700">
        <X className="h-5 w-5" aria-hidden="true" />
        <p className="font-medium">Este pedido fue cancelado.</p>
      </div>
    );
  }
  const currentIndex = TRACKING_STEPS.indexOf(order.status);
  const dateFor = (status: string) => order.history.find((h) => h.status === status)?.createdAt;
  return (
    <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
      {TRACKING_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const date = dateFor(step);
        return (
          <li key={step} className="relative">
            <span
              className={cn(
                'absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2',
                done ? 'border-accent bg-accent text-on-accent' : 'border-slate-300 bg-white',
              )}
              aria-hidden="true"
            >
              {done ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <p className={cn('font-medium', done ? 'text-slate-900' : 'text-slate-500')}>
              {ORDER_STATUS_LABELS[step]}
              {i === currentIndex ? <span className="sr-only"> (estado actual)</span> : null}
            </p>
            {date ? <p className="text-xs text-slate-500">{formatDateTime(date)}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}
