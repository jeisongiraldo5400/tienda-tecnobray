const IP_RE = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * IP real del cliente determinada por el BFF: `x-real-ip` (Vercel) o la primera de `x-forwarded-for`.
 * Se valida el formato para no reenviar valores arbitrarios.
 */
export function clientIp(headers: Headers): string | null {
  const candidates = [headers.get('x-real-ip'), headers.get('x-forwarded-for')?.split(',')[0]];
  for (const c of candidates) {
    const ip = c?.trim();
    if (ip && IP_RE.test(ip)) return ip;
  }
  return null;
}
