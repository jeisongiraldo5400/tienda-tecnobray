import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { safeEqual } from '../utils/hash';
import { CSRF_COOKIE, CSRF_HEADER } from './cookies';

export function requiresCsrf(path: string): boolean {
  return /^\/api\/(admin|auth)(\/|$)/.test(path);
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protección CSRF (double-submit cookie) para todas las rutas que usan cookies de sesión:
 * /api/auth/* y /api/admin/*. Las rutas públicas de la tienda no leen cookies.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method) || !requiresCsrf(req.path)) return next();
    const cookie = (req.cookies?.[CSRF_COOKIE] as string | undefined) ?? '';
    const header = (req.headers[CSRF_HEADER] as string | undefined) ?? '';
    if (!cookie || !header || !safeEqual(cookie, header)) {
      throw new ForbiddenException('Token CSRF inválido o ausente. Recarga la página e intenta de nuevo.');
    }
    next();
  }
}
