'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { Brand, Category } from '@/shared/types/domain';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { countActiveFilters } from '../adapters/filters';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { ActiveFilters } from './ActiveFilters';
import { FiltersPanel } from './FiltersPanel';
import { SortSelect } from './SortSelect';

interface Props {
  categories: Category[];
  brands: Brand[];
  fixedCategory?: string;
  total: number;
}

/** Barra lateral de filtros (desktop). */
export function CatalogSidebar({ categories, brands, fixedCategory }: Omit<Props, 'total'>) {
  const { filters, update, clear } = useCatalogFilters(fixedCategory);
  return <FiltersPanel filters={filters} categories={categories} brands={brands} onChange={update} onClear={clear} />;
}

/** Barra superior: total, chips de filtros activos, orden y botón de filtros (móvil). */
export function CatalogToolbar({ categories, brands, fixedCategory, total }: Props) {
  const { filters, update, clear, isPending } = useCatalogFilters(fixedCategory);
  const [open, setOpen] = useState(false);
  const active = countActiveFilters({ ...filters, q: undefined, categoria: fixedCategory ? undefined : filters.categoria });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="order-last w-full text-sm text-slate-500 sm:order-none sm:w-auto" aria-live="polite">
          {isPending ? 'Actualizando…' : `${total} ${total === 1 ? 'producto' : 'productos'}`}
        </p>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button variant="outline" size="md" className="flex-1 sm:flex-none lg:hidden" onClick={() => setOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros{active > 0 ? ` (${active})` : ''}
          </Button>
          <SortSelect value={filters.orden} onChange={(orden) => update({ orden })} />
        </div>
      </div>
      <ActiveFilters filters={filters} categories={categories} brands={brands} onChange={update} lockedCategory={!!fixedCategory} />
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filtrar productos"
        side="bottom"
        footer={
          <Button variant="primary" size="lg" className="w-full" onClick={() => setOpen(false)}>
            Ver {total} {total === 1 ? 'producto' : 'productos'}
          </Button>
        }
      >
        <div className="p-5">
          <FiltersPanel
            filters={filters}
            categories={categories}
            brands={brands}
            onChange={(patch) => {
              update(patch);
              setOpen(false);
            }}
            onClear={() => {
              clear();
              setOpen(false);
            }}
          />
        </div>
      </Drawer>
    </div>
  );
}
