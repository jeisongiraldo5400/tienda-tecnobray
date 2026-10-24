import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTargetPath, proxyToBackend } from './bff';
import { clientIp } from './client-ip';
import { getSetCookies, rewriteSetCookie } from './set-cookie';

describe('BFF', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('valida segmentos de ruta (sin path traversal)', () => {
    expect(buildTargetPath(['store', 'products'])).toBe('/store/products');
    expect(buildTargetPath(['..', 'secret'])).toBeNull();
    expect(buildTargetPath(['a%2F..'])).toBeNull();
    expect(buildTargetPath([])).toBeNull();
  });

  it('reescribe Set-Cookie: sin Domain, Path=/ y sin Secure en http', () => {
    const out = rewriteSetCookie('tb_rt=abc; Domain=api.x.com; Path=/api/auth; HttpOnly; Secure; SameSite=None', { secure: false });
    expect(out).toBe('tb_rt=abc; Path=/; HttpOnly; SameSite=Lax');
    const secure = rewriteSetCookie('tb_at=1; Path=/; HttpOnly; Secure; SameSite=Lax', { secure: true });
    expect(secure).toBe('tb_at=1; Path=/; HttpOnly; Secure; SameSite=Lax');
  });

  it('reenvía método, cuerpo, cookies, CSRF e Idempotency-Key al backend y devuelve Set-Cookie', async () => {
    const upstreamHeaders = new Headers({ 'content-type': 'application/json' });
    upstreamHeaders.append('set-cookie', 'tb_csrf=new; Path=/; SameSite=Lax');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 201, headers: upstreamHeaders }));
    const req = new Request('http://localhost:3002/api/bff/store/orders?x=1', {
      method: 'POST',
      headers: { cookie: 'tb_csrf=t', 'x-csrf-token': 't', 'idempotency-key': 'k-12345678', 'content-type': 'application/json', authorization: 'Bearer nope' },
      body: '{"a":1}',
    });
    const res = await proxyToBackend(req, ['store', 'orders']);
    expect(res.status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('http://127.0.0.1:4001/api/store/orders?x=1');
    const h = (init as RequestInit).headers as Headers;
    expect(h.get('cookie')).toBe('tb_csrf=t');
    expect(h.get('x-csrf-token')).toBe('t');
    expect(h.get('idempotency-key')).toBe('k-12345678');
    expect(h.get('authorization')).toBeNull();
    expect(new TextDecoder().decode((init as RequestInit).body as ArrayBuffer)).toBe('{"a":1}');
    expect(getSetCookies(res.headers)).toEqual(['tb_csrf=new; Path=/; SameSite=Lax']);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('responde 502 en español si el backend no está disponible', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    const res = await proxyToBackend(new Request('http://localhost:3002/api/bff/store/home'), ['store', 'home']);
    expect(res.status).toBe(502);
    expect((await res.json()).message).toMatch(/No fue posible conectar/);
  });

  it('IP del cliente: x-real-ip, luego la primera de x-forwarded-for; descarta valores inválidos', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' }))).toBe('203.0.113.7');
    expect(clientIp(new Headers({ 'x-forwarded-for': '198.51.100.2, 10.0.0.1' }))).toBe('198.51.100.2');
    expect(clientIp(new Headers({ 'x-forwarded-for': '<script>' }))).toBeNull();
    expect(clientIp(new Headers())).toBeNull();
  });

  it('envía X-BFF-Secret y X-BFF-Client-IP propios y descarta los X-BFF-* / X-Forwarded-For del navegador', async () => {
    vi.resetModules();
    vi.stubEnv('BFF_SHARED_SECRET', 'secreto-de-prueba');
    const { proxyToBackend: proxyWithSecret } = await import('./bff');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await proxyWithSecret(
      new Request('http://localhost:3002/api/bff/store/orders/track', {
        method: 'POST',
        headers: {
          'x-bff-secret': 'falso',
          'x-bff-client-ip': '6.6.6.6',
          'x-bff-otro': 'x',
          'x-forwarded-for': '198.51.100.9, 10.0.0.1',
        },
        body: '{}',
      }),
      ['store', 'orders', 'track'],
    );
    const h = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Headers;
    expect(h.get('x-bff-secret')).toBe('secreto-de-prueba');
    expect(h.get('x-bff-client-ip')).toBe('198.51.100.9');
    expect(h.get('x-bff-otro')).toBeNull();
    expect(h.get('x-forwarded-for')).toBeNull();
  });

  it('sin secreto configurado no envía encabezados X-BFF-*', async () => {
    vi.resetModules();
    vi.stubEnv('BFF_SHARED_SECRET', '');
    const { proxyToBackend: proxyNoSecret } = await import('./bff');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    await proxyNoSecret(new Request('http://localhost:3002/api/bff/store/home', { headers: { 'x-bff-secret': 'falso' } }), ['store', 'home']);
    const h = (fetchMock.mock.calls[0]![1] as RequestInit).headers as Headers;
    expect(h.get('x-bff-secret')).toBeNull();
  });
});
