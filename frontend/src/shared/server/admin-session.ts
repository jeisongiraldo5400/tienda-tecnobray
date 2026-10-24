import { getSetCookies, parseSetCookie } from './set-cookie';

/** Configuración de sesión (sin dependencias de Next para poder probarla). */
export interface SessionConfig {
  apiBase: string; // API_BASE_URL + API_PREFIX
  accessCookie: string;
  refreshCookie: string;
  csrfCookie: string;
  csrfHeader: string;
  bffSecret: string;
}

export function sessionConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SessionConfig {
  const base = (env.API_BASE_URL || 'http://127.0.0.1:4001').replace(/\/+$/, '');
  const rawPrefix = (env.API_PREFIX ?? '/api').trim();
  const prefix = !rawPrefix || rawPrefix === '/' ? '' : `/${rawPrefix.replace(/^\/+|\/+$/g, '')}`;
  return {
    apiBase: `${base}${prefix}`,
    accessCookie: env.ADMIN_ACCESS_COOKIE || 'tb_at',
    refreshCookie: env.ADMIN_REFRESH_COOKIE || 'tb_rt',
    csrfCookie: env.NEXT_PUBLIC_CSRF_COOKIE || 'tb_csrf',
    csrfHeader: env.NEXT_PUBLIC_CSRF_HEADER || 'x-csrf-token',
    bffSecret: env.BFF_SHARED_SECRET || '',
  };
}

export type AdminRouteDecision = 'public' | 'allow' | 'refresh' | 'login';

/** Decide qué hacer con una ruta /admin según las cookies presentes. */
export function decideAdminRoute(pathname: string, cookies: { has: (name: string) => boolean }, cfg: SessionConfig): AdminRouteDecision {
  if (!pathname.startsWith('/admin')) return 'public';
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return 'public';
  if (cookies.has(cfg.accessCookie)) return 'allow';
  if (cookies.has(cfg.refreshCookie)) return 'refresh';
  return 'login';
}

export interface RefreshResult {
  ok: boolean;
  /** Set-Cookie tal como los envía el backend. */
  setCookies: string[];
}

/**
 * Renueva la sesión en el servidor: POST /auth/refresh con la cookie de refresh y el token CSRF
 * (double-submit). Si no hay cookie CSRF, la obtiene primero con GET /auth/csrf.
 */
export async function refreshAdminSession(
  cookieHeader: string,
  csrfToken: string | undefined,
  cfg: SessionConfig,
  fetchImpl: typeof fetch = fetch,
  clientIp: string | null = null,
): Promise<RefreshResult> {
  const extraCookies: string[] = [];
  const trust: Record<string, string> = cfg.bffSecret
    ? { 'x-bff-secret': cfg.bffSecret, ...(clientIp ? { 'x-bff-client-ip': clientIp } : {}) }
    : {};
  let token = csrfToken;
  try {
    if (!token) {
      const res = await fetchImpl(`${cfg.apiBase}/auth/csrf`, { headers: { accept: 'application/json', ...trust }, cache: 'no-store' });
      if (!res.ok) return { ok: false, setCookies: [] };
      const body = (await res.json().catch(() => ({}))) as { csrfToken?: string };
      token = body.csrfToken;
      extraCookies.push(...getSetCookies(res.headers));
      if (!token) return { ok: false, setCookies: [] };
    }
    const cookie = csrfToken ? cookieHeader : [cookieHeader, `${cfg.csrfCookie}=${token}`].filter(Boolean).join('; ');
    const res = await fetchImpl(`${cfg.apiBase}/auth/refresh`, {
      method: 'POST',
      headers: { cookie, [cfg.csrfHeader]: token, accept: 'application/json', ...trust },
      cache: 'no-store',
    });
    return { ok: res.ok, setCookies: [...extraCookies, ...getSetCookies(res.headers)] };
  } catch {
    return { ok: false, setCookies: [] };
  }
}

/** Fusiona la cabecera Cookie actual con los Set-Cookie nuevos (para que el render vea la sesión renovada). */
export function mergeCookieHeader(cookieHeader: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) jar.set(pair.slice(0, idx), pair.slice(idx + 1));
    });
  for (const sc of setCookies) {
    const { name, value, maxAge, expires } = parseSetCookie(sc);
    const expired = (maxAge !== undefined && maxAge <= 0) || (expires !== undefined && expires.getTime() < Date.now()) || value === '';
    if (expired) jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}
