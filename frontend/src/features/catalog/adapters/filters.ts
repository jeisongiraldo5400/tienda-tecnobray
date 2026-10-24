import type { QueryValue } from '@/shared/lib/query-string';

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre: A-Z' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const PAGE_SIZE = 12;

/** Filtros del catálogo tal como viven en la URL (en español). */
export interface CatalogFilters {
  q?: string;
  categoria?: string;
  marca?: string;
  min?: number;
  max?: number;
  orden?: SortValue;
  pagina?: number;
}

type SearchParamsLike = Record<string, string | string[] | undefined> | URLSearchParams;

function first(sp: SearchParamsLike, key: string): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

function positiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

const SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value));

export function parseCatalogFilters(sp: SearchParamsLike): CatalogFilters {
  const q = first(sp, 'q')?.trim().slice(0, 100);
  const orden = first(sp, 'orden');
  let min = positiveInt(first(sp, 'min'));
  let max = positiveInt(first(sp, 'max'));
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  return {
    q: q || undefined,
    categoria: first(sp, 'categoria') || undefined,
    marca: first(sp, 'marca') || undefined,
    min,
    max,
    orden: orden && SORTS.has(orden) ? (orden as SortValue) : undefined,
    pagina: positiveInt(first(sp, 'pagina')),
  };
}

/** Serializa filtros a query string de la URL pública (omite defaults). */
export function serializeCatalogFilters(f: CatalogFilters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.categoria) sp.set('categoria', f.categoria);
  if (f.marca) sp.set('marca', f.marca);
  if (f.min) sp.set('min', String(f.min));
  if (f.max) sp.set('max', String(f.max));
  if (f.orden && f.orden !== 'relevance') sp.set('orden', f.orden);
  if (f.pagina && f.pagina > 1) sp.set('pagina', String(f.pagina));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** Traduce filtros de la URL a parámetros del backend. */
export function toApiQuery(f: CatalogFilters, limit = PAGE_SIZE): Record<string, QueryValue> {
  return {
    q: f.q,
    category: f.categoria,
    brand: f.marca,
    minPrice: f.min,
    maxPrice: f.max,
    sort: f.orden && f.orden !== 'relevance' ? f.orden : undefined,
    page: f.pagina ?? 1,
    pageSize: limit,
  };
}

export function countActiveFilters(f: CatalogFilters): number {
  return [f.q, f.categoria, f.marca, f.min, f.max].filter((v) => v !== undefined && v !== '').length;
}
