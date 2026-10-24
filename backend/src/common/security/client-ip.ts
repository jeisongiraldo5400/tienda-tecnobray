import type { Request } from 'express';
import { safeEqual } from '../utils/hash';

export const BFF_SECRET_HEADER = 'x-bff-secret';
export const BFF_CLIENT_IP_HEADER = 'x-bff-client-ip';

/** true si la solicitud trae el secreto compartido del BFF del frontend (BFF_SHARED_SECRET). */
export function isTrustedBff(req: Request, secret: string | undefined = process.env.BFF_SHARED_SECRET): boolean {
  const provided = req.headers[BFF_SECRET_HEADER];
  return !!secret && typeof provided === 'string' && provided.length > 0 && safeEqual(provided, secret);
}

const IP_REGEX = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * IP real del cliente para el rate limiting.
 * - Solicitudes del BFF (con X-BFF-Secret válido): se usa X-BFF-Client-IP o, en su defecto,
 *   la primera IP de X-Forwarded-For (el BFF debe enviar SOLO la IP que él determinó).
 * - Cualquier otra solicitud: req.ip (sin confiar en X-Forwarded-For salvo que TRUST_PROXY lo indique).
 * Devuelve null cuando el BFF no informa IP (llamadas servidor-a-servidor, p. ej. ISR).
 */
export function clientIp(req: Request, secret?: string): string | null {
  if (isTrustedBff(req, secret ?? process.env.BFF_SHARED_SECRET)) {
    const explicit = req.headers[BFF_CLIENT_IP_HEADER];
    const xff = req.headers['x-forwarded-for'];
    const candidate =
      (typeof explicit === 'string' && explicit.trim()) ||
      (typeof xff === 'string' ? xff.split(',')[0].trim() : Array.isArray(xff) ? xff[0]?.split(',')[0].trim() : '');
    return candidate && IP_REGEX.test(candidate) ? candidate : null;
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}
