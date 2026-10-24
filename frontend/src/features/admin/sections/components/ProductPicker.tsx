'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { productsService } from '@/features/admin/products/services/products.service';
import { moveItem } from '@/features/admin/products/components/ProductImagesManager';
import { SearchInput } from '@/features/admin/shell/components/SearchInput';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { Spinner } from '@/shared/ui/Spinner';
import { MAX_SECTION_PRODUCTS, type SectionProduct } from '../adapters/section.adapter';

/** Buscador de productos + lista ordenable de los elegidos. */
export function ProductPicker({ value, onChange }: { value: SectionProduct[]; onChange: (v: SectionProduct[]) => void }) {
  const [q, setQ] = useState('');
  const results = useQuery({
    queryKey: ['admin', 'products', 'picker', q],
    queryFn: () => productsService.list({ q: q || undefined, pageSize: 8, sort: 'newest' }),
    enabled: q.length >= 2,
  });
  const chosen = new Set(value.map((p) => p.id));

  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Buscar producto por nombre o SKU" label="Buscar producto" />
      {q.length >= 2 ? (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
          {results.isFetching ? (
            <div className="flex justify-center p-3">
              <Spinner />
            </div>
          ) : (results.data?.items ?? []).length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Sin resultados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.data!.items.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white">
                    <RemoteImage src={p.mainImageUrl} alt="" fill sizes="32px" className="object-contain" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {p.name} <span className="text-xs text-slate-400">· {p.sku}</span>
                  </span>
                  <button
                    type="button"
                    disabled={chosen.has(p.id) || value.length >= MAX_SECTION_PRODUCTS}
                    onClick={() => onChange([...value, { id: p.id, name: p.name, sku: p.sku, thumbUrl: p.mainImageUrl, active: p.active }])}
                    className="rounded-lg p-1.5 text-brand hover:bg-brand-soft disabled:opacity-30"
                    aria-label={`Agregar ${p.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <ol className="space-y-1.5" aria-label="Productos de la sección">
        {value.map((p, i) => (
          <li key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
            <span className="w-5 text-center text-xs text-slate-400">{i + 1}</span>
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-white">
              <RemoteImage src={p.thumbUrl} alt="" fill sizes="32px" className="object-contain" />
            </div>
            <span className="min-w-0 flex-1 truncate text-sm">
              {p.name}
              {!p.active ? <span className="ml-1 text-xs text-amber-600">(inactivo)</span> : null}
            </span>
            <button type="button" disabled={i === 0} onClick={() => onChange(moveItem(value, i, i - 1))} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Subir">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" disabled={i === value.length - 1} onClick={() => onChange(moveItem(value, i, i + 1))} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Bajar">
              <ArrowDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onChange(value.filter((x) => x.id !== p.id))} className="rounded p-1 text-red-600 hover:bg-red-50" aria-label={`Quitar ${p.name}`}>
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
