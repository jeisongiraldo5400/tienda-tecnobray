import 'server-only';
import { apiUrl, serverEnv } from '@/shared/config/env.server';
import { toApiError } from './errors';
import { unwrap } from './normalize';

export interface ServerFetchOptions {
  /** Etiquetas de caché para revalidación bajo demanda. */
  tags?: string[];
  /** Segundos de ISR; `false` = sin caché (dinámico). */
  revalidate?: number | false;
  /** Cabecera Cookie a reenviar (solo para llamadas autenticadas, nunca cacheadas). */
  cookie?: string;
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Fetch desde componentes de servidor directamente al backend (API_BASE_URL).
 * Las respuestas públicas usan ISR con tags; las autenticadas no se cachean.
 */
export async function serverFetch<T = unknown>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const { tags, cookie, method = 'GET', body, signal } = options;
  const revalidate = cookie ? false : (options.revalidate ?? serverEnv.revalidateSeconds);
  // X-BFF-Secret sin IP: el backend no aplica throttling a los render de servidor / ISR.
  const headers: Record<string, string> = { accept: 'application/json' };
  if (serverEnv.bffSecret) headers['x-bff-secret'] = serverEnv.bffSecret;
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = 'application/json';

  const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: signal ?? AbortSignal.timeout(10_000),
  };
  if (revalidate === false) {
    init.cache = 'no-store';
  } else {
    init.next = { revalidate, tags };
  }

  const res = await fetch(apiUrl(path), init);
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) throw toApiError(res.status, data);
  return unwrap(data) as T;
}

/** Variante que devuelve `fallback` si el backend falla (para secciones no críticas). */
export async function serverFetchSafe<T>(
  path: string,
  fallback: T,
  options: ServerFetchOptions = {},
): Promise<T> {
  try {
    return await serverFetch<T>(path, options);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[api] ${path} falló:`, error instanceof Error ? error.message : error);
    }
    return fallback;
  }
}
