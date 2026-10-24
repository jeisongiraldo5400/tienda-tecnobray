'use client';

import { SORT_OPTIONS, type SortValue } from '../adapters/filters';

export function SortSelect({ value, onChange }: { value?: SortValue; onChange: (value: SortValue) => void }) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-600 sm:flex-none">
      <span className="hidden whitespace-nowrap sm:inline">Ordenar por</span>
      <select
        value={value ?? 'relevance'}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-800 focus:border-accent-text focus:ring-2 focus:ring-accent/40 focus:outline-none sm:w-auto md:h-10 md:text-sm"
        aria-label="Ordenar productos"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
