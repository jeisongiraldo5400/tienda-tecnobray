'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import { parseCatalogFilters, serializeCatalogFilters, type CatalogFilters } from '../adapters/filters';

/** Construye la URL destino. En /categoria/[slug] la categoría vive en la ruta. */
export function buildCatalogHref(filters: CatalogFilters, categoryInPath: boolean): string {
  if (categoryInPath && filters.categoria) {
    const { categoria, ...rest } = filters;
    return `/categoria/${encodeURIComponent(categoria)}${serializeCatalogFilters(rest)}`;
  }
  return `/productos${serializeCatalogFilters(filters)}`;
}

/** Filtros del catálogo sincronizados con la URL. */
export function useCatalogFilters(fixedCategory?: string) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo<CatalogFilters>(() => {
    const parsed = parseCatalogFilters(params);
    return fixedCategory ? { ...parsed, categoria: fixedCategory } : parsed;
  }, [params, fixedCategory]);

  const update = useCallback(
    (patch: Partial<CatalogFilters>, options: { resetPage?: boolean } = { resetPage: true }) => {
      const next: CatalogFilters = { ...filters, ...patch };
      if (options.resetPage !== false && !('pagina' in patch)) next.pagina = undefined;
      const href = buildCatalogHref(next, !!fixedCategory);
      startTransition(() => router.push(href, { scroll: false }));
    },
    [filters, fixedCategory, router],
  );

  const clear = useCallback(() => {
    startTransition(() => router.push(`/productos${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ''}`));
  }, [filters.q, router]);

  return { filters, update, clear, isPending };
}
