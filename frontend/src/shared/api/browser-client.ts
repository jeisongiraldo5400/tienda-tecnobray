import { publicEnv } from '@/shared/config/env.public';
import { readBrowserCookie } from '@/shared/lib/cookies';
import { endpoints } from './endpoints';
import { ApiError, toApiError } from './errors';
import { unwrap } from './normalize';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** Si es true, ante un 401 intenta refrescar la sesión una vez y reintenta. */
  auth?: boolean;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let csrfToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/** Callback cuando la sesión del admin no se puede renovar (p. ej. redirigir al login). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function currentCsrf(): string | null {
  return readBrowserCookie(publicEnv.csrfCookie) ?? csrfToken;
}

async function parse(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { accept: 'application/json', ...options.headers };
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  if (MUTATING.has(method)) {
    const token = currentCsrf();
    if (token) headers[publicEnv.csrfHeader] = token;
  }
  if (options.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;

  return fetch(`${publicEnv.bffBase}${path}`, {
    method,
    headers,
    body,
    credentials: 'same-origin',
    signal: options.signal,
    cache: 'no-store',
  });
}

async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = rawRequest(endpoints.auth.refresh, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = unwrap(await parse(res)) as { csrfToken?: string } | null;
        if (data && typeof data.csrfToken === 'string') setCsrfToken(data.csrfToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/** Cliente HTTP del navegador. Todas las llamadas pasan por el BFF (/api/bff/*). */
export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);
  if (res.status === 401 && options.auth) {
    const ok = await refreshSession();
    if (ok) {
      res = await rawRequest(path, options);
    }
    if (res.status === 401) {
      onUnauthorized?.();
    }
  }
  const data = await parse(res);
  if (!res.ok) throw toApiError(res.status, data);
  return unwrap(data) as T;
}

export const adminApi = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { auth: true, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body, auth: true }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body, auth: true }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body, auth: true }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE', auth: true }),
};

export { ApiError };
