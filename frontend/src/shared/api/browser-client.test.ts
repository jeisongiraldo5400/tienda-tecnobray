import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/fixtures';
import { adminApi, apiRequest, setCsrfToken, setUnauthorizedHandler } from './browser-client';
import { ApiError } from './errors';

function headersOf(call: unknown[]): Record<string, string> {
  return ((call[1] as RequestInit).headers ?? {}) as Record<string, string>;
}

describe('browser-client (BFF)', () => {
  afterEach(() => {
    document.cookie = 'tb_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    setCsrfToken(null);
    setUnauthorizedHandler(null);
  });

  it('llama al BFF y envía el token CSRF de la cookie en escrituras', async () => {
    document.cookie = 'tb_csrf=abc123; path=/';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));
    await adminApi.post('/admin/brands', { name: 'X' });
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/bff/admin/brands');
    expect(headersOf(fetchMock.mock.calls[0]!)['x-csrf-token']).toBe('abc123');
    expect(headersOf(fetchMock.mock.calls[0]!)['content-type']).toBe('application/json');
  });

  it('no envía CSRF en GET', async () => {
    document.cookie = 'tb_csrf=abc123; path=/';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([]));
    await adminApi.get('/admin/brands');
    expect(headersOf(fetchMock.mock.calls[0]!)['x-csrf-token']).toBeUndefined();
  });

  it('envía FormData sin content-type (multipart) e Idempotency-Key', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));
    const form = new FormData();
    form.append('files', new Blob(['x']), 'a.png');
    await apiRequest('/admin/products/1/images', { method: 'POST', body: form, idempotencyKey: 'key-12345678' });
    const h = headersOf(fetchMock.mock.calls[0]!);
    expect(h['content-type']).toBeUndefined();
    expect(h['idempotency-key']).toBe('key-12345678');
    expect((fetchMock.mock.calls[0]![1] as RequestInit).body).toBe(form);
  });

  it('ante 401 refresca la sesión una vez y reintenta', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ message: 'No autenticado' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ user: {} }))
      .mockResolvedValueOnce(jsonResponse({ ordersToday: 3 }));
    const data = await adminApi.get<{ ordersToday: number }>('/admin/dashboard');
    expect(data.ordersToday).toBe(3);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/bff/admin/dashboard', '/api/bff/auth/refresh', '/api/bff/admin/dashboard']);
  });

  it('si el refresh falla llama al manejador de sesión expirada', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({}, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({}, { status: 401 }));
    await expect(adminApi.get('/admin/dashboard')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('las rutas públicas no intentan refrescar', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ message: 'No encontrado' }, { status: 404 }));
    await expect(apiRequest('/store/orders/track', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 404, message: 'No encontrado' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
