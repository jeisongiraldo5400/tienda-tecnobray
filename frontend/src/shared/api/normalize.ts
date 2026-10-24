import type { Paginated } from '@/shared/types/domain';

/** Helpers tolerantes para mapear DTOs del backend (números como string, nulls, etc.). */
export type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Raw) : {};
}

export function str(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

export function optStr(value: unknown): string | undefined {
  const s = str(value);
  return s ? s : undefined;
}

export function num(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function optNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = num(value, Number.NaN);
  return Number.isNaN(n) ? null : n;
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return fallback;
}

export function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Acepta {items|data|results, total, page, limit, totalPages} o {data, meta:{...}} o un arreglo plano. */
export function toPaginated<T>(raw: unknown, mapItem: (item: unknown) => T): Paginated<T> {
  if (Array.isArray(raw)) {
    return { items: raw.map(mapItem), total: raw.length, page: 1, limit: raw.length, totalPages: 1 };
  }
  const r = asRecord(raw);
  const meta = asRecord(r.meta ?? r.pagination);
  const list = arr(r.items ?? r.data ?? r.results);
  const total = num(r.total ?? meta.total ?? meta.totalItems, list.length);
  const limit = num(r.limit ?? r.pageSize ?? meta.limit ?? meta.pageSize ?? meta.perPage, list.length || 1);
  const page = num(r.page ?? meta.page ?? meta.currentPage, 1);
  const totalPages = num(
    r.totalPages ?? meta.totalPages ?? meta.pages,
    limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1,
  );
  return { items: list.map(mapItem), total, page, limit, totalPages };
}

/** Si el backend envuelve la respuesta en {data: ...}, la desenvuelve. */
export function unwrap(raw: unknown): unknown {
  const r = asRecord(raw);
  const keys = Object.keys(r);
  if (keys.length > 0 && 'data' in r && keys.every((k) => ['data', 'success', 'message', 'statusCode'].includes(k))) {
    return r.data;
  }
  return raw;
}
