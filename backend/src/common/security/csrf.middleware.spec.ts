import { ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CsrfMiddleware, requiresCsrf } from './csrf.middleware';

const req = (method: string, path: string, cookie?: string, header?: string) =>
  ({ method, path, cookies: cookie ? { tb_csrf: cookie } : {}, headers: header ? { 'x-csrf-token': header } : {} }) as unknown as Request;

describe('CsrfMiddleware', () => {
  const mw = new CsrfMiddleware();
  const res = {} as Response;

  it('solo protege /api/admin y /api/auth', () => {
    expect(requiresCsrf('/api/admin/products')).toBe(true);
    expect(requiresCsrf('/api/auth/login')).toBe(true);
    expect(requiresCsrf('/api/store/orders')).toBe(false);
    expect(requiresCsrf('/api/administrador')).toBe(false);
  });

  it('deja pasar métodos seguros y rutas públicas', () => {
    const next = vi.fn();
    mw.use(req('GET', '/api/admin/products'), res, next);
    mw.use(req('POST', '/api/store/orders'), res, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('rechaza escrituras sin token o con token distinto', () => {
    expect(() => mw.use(req('POST', '/api/admin/products'), res, vi.fn())).toThrow(ForbiddenException);
    expect(() => mw.use(req('PATCH', '/api/admin/products/1', 'abc', 'xyz'), res, vi.fn())).toThrow(ForbiddenException);
  });

  it('acepta cuando cookie y encabezado coinciden', () => {
    const next = vi.fn();
    mw.use(req('DELETE', '/api/admin/products/1', 'token-123', 'token-123'), res, next);
    expect(next).toHaveBeenCalled();
  });
});
