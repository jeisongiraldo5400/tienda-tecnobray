import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';
import { decideAdminRoute, mergeCookieHeader, refreshAdminSession, sessionConfigFromEnv } from './shared/server/admin-session';

const cfg = sessionConfigFromEnv({} as NodeJS.ProcessEnv);
const jar = (names: string[]) => ({ has: (n: string) => names.includes(n) });

describe('decideAdminRoute', () => {
  it('rutas públicas y login', () => {
    expect(decideAdminRoute('/', jar([]), cfg)).toBe('public');
    expect(decideAdminRoute('/admin/login', jar([]), cfg)).toBe('public');
  });
  it('sesión vigente, refresh o login', () => {
    expect(decideAdminRoute('/admin/productos', jar(['tb_at']), cfg)).toBe('allow');
    expect(decideAdminRoute('/admin', jar(['tb_rt']), cfg)).toBe('refresh');
    expect(decideAdminRoute('/admin', jar([]), cfg)).toBe('login');
  });
});

describe('refreshAdminSession', () => {
  it('obtiene CSRF si falta y llama a /auth/refresh con double-submit', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"csrfToken":"tok"}', { headers: { 'set-cookie': 'tb_csrf=tok; Path=/' } }))
      .mockResolvedValueOnce(new Response('{"user":{}}', { headers: { 'set-cookie': 'tb_at=new; Path=/; HttpOnly' } }));
    const res = await refreshAdminSession('tb_rt=r1', undefined, cfg, fetchImpl as unknown as typeof fetch);
    expect(res.ok).toBe(true);
    expect(fetchImpl.mock.calls[0]![0]).toBe('http://127.0.0.1:4001/api/auth/csrf');
    const [url, init] = fetchImpl.mock.calls[1]!;
    expect(url).toBe('http://127.0.0.1:4001/api/auth/refresh');
    expect(init.headers.cookie).toBe('tb_rt=r1; tb_csrf=tok');
    expect(init.headers['x-csrf-token']).toBe('tok');
    expect(res.setCookies).toHaveLength(2);
  });

  it('falla si el backend rechaza el refresh', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
    expect((await refreshAdminSession('tb_rt=r', 'c', cfg, fetchImpl as unknown as typeof fetch)).ok).toBe(false);
  });
});

describe('mergeCookieHeader', () => {
  it('agrega, reemplaza y elimina cookies', () => {
    const merged = mergeCookieHeader('tb_rt=old; tb_csrf=c; otra=1', ['tb_rt=new; Path=/', 'tb_at=a; Max-Age=900', 'otra=; Max-Age=0']);
    expect(merged).toBe('tb_rt=new; tb_csrf=c; tb_at=a');
  });
});

describe('proxy (middleware de /admin)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('redirige al login sin sesión conservando la ruta', async () => {
    const res = await proxy(new NextRequest('http://localhost:3002/admin/pedidos?estado=nuevo'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3002/admin/login?next=%2Fadmin%2Fpedidos%3Festado%3Dnuevo');
  });

  it('deja pasar con access token', async () => {
    const res = await proxy(new NextRequest('http://localhost:3002/admin', { headers: { cookie: 'tb_at=x' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('renueva la sesión en el servidor cuando solo hay refresh token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"user":{}}', { headers: { 'set-cookie': 'tb_at=nuevo; Path=/; HttpOnly; SameSite=Lax' } }),
    );
    const res = await proxy(new NextRequest('http://localhost:3002/admin', { headers: { cookie: 'tb_rt=r; tb_csrf=c' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('tb_at=nuevo; Path=/');
    expect(res.headers.get('x-middleware-request-cookie')).toContain('tb_at=nuevo');
  });

  it('si el refresh falla, redirige al login y borra el refresh', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));
    const res = await proxy(new NextRequest('http://localhost:3002/admin', { headers: { cookie: 'tb_rt=r; tb_csrf=c' } }));
    expect(res.status).toBe(307);
    expect(res.headers.get('set-cookie')).toContain('tb_rt=;');
  });
});
