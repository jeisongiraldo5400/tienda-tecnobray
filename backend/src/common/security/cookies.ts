import type { CookieOptions, Response } from 'express';
import type { AppConfig } from '../../config/app-config';

export const ACCESS_COOKIE = 'tb_at';
export const REFRESH_COOKIE = 'tb_rt';
export const CSRF_COOKIE = 'tb_csrf';
export const CSRF_HEADER = 'x-csrf-token';
/**
 * El refresh solo viaja a las rutas de auth. Configurable con REFRESH_COOKIE_PATH si el
 * frontend expone el proxy de la API bajo otro prefijo (p. ej. /backend/auth).
 */
export const REFRESH_COOKIE_PATH = '/api/auth';
const refreshPath = (cfg: AppConfig) => cfg.refreshCookiePath ?? REFRESH_COOKIE_PATH;

function base(cfg: AppConfig): CookieOptions {
  return { secure: cfg.cookieSecure, sameSite: 'lax', domain: cfg.cookieDomain };
}

export function setAuthCookies(res: Response, cfg: AppConfig, access: string, refresh: string, refreshExpires: Date): void {
  res.cookie(ACCESS_COOKIE, access, {
    ...base(cfg),
    httpOnly: true,
    path: '/',
    maxAge: cfg.jwt.accessTtlSeconds * 1000,
  });
  res.cookie(REFRESH_COOKIE, refresh, {
    ...base(cfg),
    httpOnly: true,
    path: refreshPath(cfg),
    expires: refreshExpires,
  });
}

export function clearAuthCookies(res: Response, cfg: AppConfig): void {
  res.clearCookie(ACCESS_COOKIE, { ...base(cfg), httpOnly: true, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...base(cfg), httpOnly: true, path: refreshPath(cfg) });
}

/** Cookie CSRF legible por JS (patrón double-submit): el cliente la reenvía en X-CSRF-Token. */
export function setCsrfCookie(res: Response, cfg: AppConfig, token: string): void {
  res.cookie(CSRF_COOKIE, token, { ...base(cfg), httpOnly: false, path: '/', maxAge: 12 * 3600 * 1000 });
}
