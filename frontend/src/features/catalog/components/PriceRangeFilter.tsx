'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/Button';

function parseAmount(value: string): number | undefined {
  const n = Number(value.replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function PriceRangeFilter({
  min,
  max,
  onApply,
}: {
  min?: number;
  max?: number;
  onApply: (range: { min?: number; max?: number }) => void;
}) {
  const [from, setFrom] = useState(min ? String(min) : '');
  const [to, setTo] = useState(max ? String(max) : '');

  function submit(e: FormEvent) {
    e.preventDefault();
    let a = parseAmount(from);
    let b = parseAmount(to);
    if (a !== undefined && b !== undefined && a > b) [a, b] = [b, a];
    onApply({ min: a, max: b });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">
          Desde
          <input
            inputMode="numeric"
            value={from}
            onChange={(e) => setFrom(e.target.value.replace(/\D/g, ''))}
            placeholder="$ 0"
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 focus:border-accent-text focus:ring-2 focus:ring-accent/40 focus:outline-none lg:h-9 lg:text-sm"
          />
        </label>
        <label className="text-xs text-slate-500">
          Hasta
          <input
            inputMode="numeric"
            value={to}
            onChange={(e) => setTo(e.target.value.replace(/\D/g, ''))}
            placeholder="Sin límite"
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 focus:border-accent-text focus:ring-2 focus:ring-accent/40 focus:outline-none lg:h-9 lg:text-sm"
          />
        </label>
      </div>
      <Button type="submit" variant="outline" size="md" className="w-full lg:h-9">
        Aplicar precio
      </Button>
    </form>
  );
}
