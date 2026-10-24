'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface QuantityStepperProps {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
  label?: string;
}

export function QuantityStepper({ value, max, min = 1, onChange, size = 'md', label = 'Cantidad' }: QuantityStepperProps) {
  const btn = cn(
    'flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent',
    size === 'sm' ? 'h-10 w-10 md:h-8 md:w-8' : 'h-11 w-11',
  );
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white" role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Disminuir cantidad">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn('min-w-8 text-center font-semibold tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar cantidad">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
