'use client';

import { X } from 'lucide-react';
import { formatCOP } from '@/shared/lib/format';
import type { Brand, Category } from '@/shared/types/domain';
import type { CatalogFilters } from '../adapters/filters';

export function ActiveFilters({
  filters,
  categories,
  brands,
  onChange,
  lockedCategory,
}: {
  filters: CatalogFilters;
  categories: Category[];
  brands: Brand[];
  onChange: (patch: Partial<CatalogFilters>) => void;
  lockedCategory?: boolean;
}) {
  const chips: Array<{ key: string; label: string; patch: Partial<CatalogFilters> }> = [];
  if (filters.q) chips.push({ key: 'q', label: `“${filters.q}”`, patch: { q: undefined } });
  if (filters.categoria && !lockedCategory) {
    const name = categories.find((c) => c.slug === filters.categoria)?.name ?? filters.categoria;
    chips.push({ key: 'cat', label: name, patch: { categoria: undefined } });
  }
  if (filters.marca) {
    const name = brands.find((b) => b.slug === filters.marca)?.name ?? filters.marca;
    chips.push({ key: 'brand', label: name, patch: { marca: undefined } });
  }
  if (filters.min || filters.max) {
    const label = filters.min && filters.max
      ? `${formatCOP(filters.min)} – ${formatCOP(filters.max)}`
      : filters.min
        ? `Desde ${formatCOP(filters.min)}`
        : `Hasta ${formatCOP(filters.max)}`;
    chips.push({ key: 'price', label, patch: { min: undefined, max: undefined } });
  }
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Filtros activos">
      {chips.map((chip) => (
        <li key={chip.key}>
          <button
            type="button"
            onClick={() => onChange(chip.patch)}
            className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-brand/15 bg-brand-soft px-3 text-sm font-medium text-brand hover:bg-slate-200"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            <span className="truncate">{chip.label}</span>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
