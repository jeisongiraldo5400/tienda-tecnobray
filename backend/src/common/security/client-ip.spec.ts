import type { Request } from 'express';
import { clientIp, isTrustedBff } from './client-ip';

const req = (headers: Record<string, string>, ip = '10.0.0.9') => ({ headers, ip, socket: {} }) as unknown as Request;
const SECRET = 'bff-secret-de-prueba-123456';

describe('clientIp', () => {
  it('ignora X-Forwarded-For sin el secreto del BFF', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4' }), SECRET)).toBe('10.0.0.9');
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4', 'x-bff-secret': 'otro' }), SECRET)).toBe('10.0.0.9');
  });

  it('usa la IP del cliente enviada por el BFF', () => {
    expect(clientIp(req({ 'x-bff-secret': SECRET, 'x-forwarded-for': '181.50.1.2, 76.76.21.21' }), SECRET)).toBe('181.50.1.2');
    expect(clientIp(req({ 'x-bff-secret': SECRET, 'x-bff-client-ip': '2800:e2:1::5', 'x-forwarded-for': '9.9.9.9' }), SECRET)).toBe('2800:e2:1::5');
  });

  it('devuelve null si el BFF no envía IP válida', () => {
    expect(clientIp(req({ 'x-bff-secret': SECRET }), SECRET)).toBeNull();
    expect(clientIp(req({ 'x-bff-secret': SECRET, 'x-forwarded-for': '<script>' }), SECRET)).toBeNull();
  });

  it('sin BFF_SHARED_SECRET configurado nunca confía', () => {
    expect(isTrustedBff(req({ 'x-bff-secret': '' }), undefined)).toBe(false);
    expect(isTrustedBff(req({ 'x-bff-secret': 'x' }), '')).toBe(false);
  });
});
