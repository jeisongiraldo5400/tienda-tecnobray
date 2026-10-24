'use client';

import { cn } from '@/shared/lib/cn';
import type { Brand, Category } from '@/shared/types/domain';
import { countActiveFilters, type CatalogFilters } from '../adapters/filters';
import { PriceRangeFilter } from './PriceRangeFilter';

export interface FiltersPanelProps {
  filters: CatalogFilters;
  categories: Category[];
  brands: Brand[];
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClear: () => void;
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors lg:min-h-9',
        active ? 'bg-brand font-semibold text-on-brand' : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  );
}

export function FiltersPanel({ filters, categories, brands, onChange, onClear }: FiltersPanelProps) {
  const active = countActiveFilters({ ...filters, q: undefined });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Filtros</h2>
        {active > 0 ? (
          <button type="button" onClick={onClear} className="min-h-9 px-2 text-sm font-medium text-accent-text hover:underline">
            Limpiar
          </button>
        ) : null}
      </div>

      <section aria-labelledby="f-cat">
        <h3 id="f-cat" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Categoría
        </h3>
        <div className="space-y-0.5">
          <OptionButton active={!filters.categoria} onClick={() => onChange({ categoria: undefined })}>
            Todas
          </OptionButton>
          {categories.map((c) => (
            <OptionButton key={c.id || c.slug} active={filters.categoria === c.slug} onClick={() => onChange({ categoria: c.slug })}>
              <span>{c.name}</span>
              {c.productCount !== undefined ? <span className="text-xs opacity-70">{c.productCount}</span> : null}
            </OptionButton>
          ))}
        </div>
      </section>

      {brands.length > 0 ? (
        <section aria-labelledby="f-brand">
          <h3 id="f-brand" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Marca
          </h3>
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            <OptionButton active={!filters.marca} onClick={() => onChange({ marca: undefined })}>
              Todas
            </OptionButton>
            {brands.map((b) => (
              <OptionButton key={b.id || b.slug} active={filters.marca === b.slug} onClick={() => onChange({ marca: b.slug })}>
                {b.name}
              </OptionButton>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="f-price">
        <h3 id="f-price" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Precio (COP)
        </h3>
        <PriceRangeFilter
          key={`${filters.min ?? ''}-${filters.max ?? ''}`}
          min={filters.min}
          max={filters.max}
          onApply={(range) => onChange(range)}
        />
      </section>
    </div>
  );
}
