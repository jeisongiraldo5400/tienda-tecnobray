/**
 * Reescribe un Set-Cookie del backend para que aplique al dominio del frontend:
 * elimina `Domain` (la cookie queda host-only) y fuerza `Path=/`, así el navegador la envía
 * tanto a /admin como a /api/bff. En desarrollo (http) elimina `Secure` salvo en localhost.
 */
export function rewriteSetCookie(header: string, options: { secure: boolean }): string {
  const parts = header.split(';').map((p) => p.trim()).filter(Boolean);
  const [nameValue, ...attrs] = parts;
  const kept = attrs.filter((attr) => {
    const key = attr.split('=')[0]!.trim().toLowerCase();
    if (key === 'domain' || key === 'path') return false;
    if (key === 'secure' && !options.secure) return false;
    return true;
  });
  // SameSite=None exige Secure; si quitamos Secure, degradamos a Lax.
  const normalized = kept.map((attr) =>
    !options.secure && /^samesite=none$/i.test(attr) ? 'SameSite=Lax' : attr,
  );
  return [nameValue, 'Path=/', ...normalized].join('; ');
}

/** Extrae los Set-Cookie de una respuesta (Headers.getSetCookie cuando existe). */
export function getSetCookies(headers: Headers): string[] {
  const h = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === 'function') return h.getSetCookie();
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

/** Parsea "a=1; Path=/; HttpOnly" -> { name: 'a', value: '1', maxAge?: number }. */
export function parseSetCookie(header: string): { name: string; value: string; maxAge?: number; expires?: Date } {
  const [nameValue = '', ...attrs] = header.split(';').map((p) => p.trim());
  const idx = nameValue.indexOf('=');
  const name = idx >= 0 ? nameValue.slice(0, idx) : nameValue;
  const value = idx >= 0 ? nameValue.slice(idx + 1) : '';
  const out: { name: string; value: string; maxAge?: number; expires?: Date } = { name, value };
  for (const attr of attrs) {
    const [k = '', v = ''] = attr.split('=');
    if (k.toLowerCase() === 'max-age') out.maxAge = Number(v);
    if (k.toLowerCase() === 'expires') out.expires = new Date(attr.slice(attr.indexOf('=') + 1));
  }
  return out;
}

export function isSecureRequest(url: string, forwardedProto?: string | null): boolean {
  if (forwardedProto) return forwardedProto.split(',')[0]!.trim() === 'https';
  return url.startsWith('https://');
}
