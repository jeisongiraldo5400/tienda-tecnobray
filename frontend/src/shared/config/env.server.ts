import 'server-only';

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizePrefix(value: string | undefined, fallback: string): string {
  const raw = (value ?? fallback).trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

/** Variables solo de servidor. Nunca importar desde componentes cliente. */
export const serverEnv = {
  apiBaseUrl: trimSlash(process.env.API_BASE_URL || 'http://127.0.0.1:4001'),
  apiPrefix: normalizePrefix(process.env.API_PREFIX, '/api'),
  revalidateSecret: process.env.REVALIDATE_SECRET || '',
  /** Secreto compartido con el backend (X-BFF-Secret). Solo servidor; nunca NEXT_PUBLIC_. */
  bffSecret: process.env.BFF_SHARED_SECRET || '',
  /** Segundos de ISR por defecto para datos públicos. */
  revalidateSeconds: Number(process.env.ISR_REVALIDATE_SECONDS || 300),
  cookies: {
    access: process.env.ADMIN_ACCESS_COOKIE || 'tb_at',
    refresh: process.env.ADMIN_REFRESH_COOKIE || 'tb_rt',
  },
};

export function apiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${serverEnv.apiBaseUrl}${serverEnv.apiPrefix}${clean}`;
}
