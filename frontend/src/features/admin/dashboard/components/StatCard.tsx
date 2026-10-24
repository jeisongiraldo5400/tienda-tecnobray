import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function StatCard({ label, value, hint, icon, tone = 'default' }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: 'default' | 'warning' }) {
  return (
    <div className={cn('min-w-0 rounded-2xl border bg-white p-4 sm:p-5', tone === 'warning' ? 'border-amber-200' : 'border-slate-200')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-5 font-medium text-slate-500 sm:text-sm">{label}</p>
        {icon ? <span className={cn('shrink-0 rounded-lg p-2', tone === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-brand text-accent')}>{icon}</span> : null}
      </div>
      <p className="mt-2 truncate text-lg font-bold tabular-nums text-slate-900 sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
