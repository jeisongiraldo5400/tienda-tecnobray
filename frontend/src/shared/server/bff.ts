import 'server-only';
import { serverEnv } from '@/shared/config/env.server';
import { clientIp } from './client-ip';
import { getSetCookies, isSecureRequest, rewriteSetCookie } from './set-cookie';

export { clientIp };

/** Cabeceras del cliente que se reenvían al backend. */
const FORWARD_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'cookie',
  'idempotency-key',
  'user-agent',
  'x-csrf-token',
  'x-xsrf-token',
  'x-request-id',
];

/** Cabeceras de la respuesta del backend que se devuelven al navegador. */
const FORWARD_RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'etag',
  'last-modified',
  'retry-after',
  'x-request-id',
  'x-total-count',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
];

const SAFE_SEGMENT = /^[A-Za-z0-9._~\-]+$/;

/** Valida y reconstruye la ruta destino; evita path traversal y rutas arbitrarias. */
export function buildTargetPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const segment of segments) {
    if (!SAFE_SEGMENT.test(segment) || segment === '.' || segment === '..') return null;
  }
  return `/${segments.join('/')}`;
}

/** Encabezados de confianza BFF → backend (X-BFF-Secret + X-BFF-Client-IP). */
export function bffTrustHeaders(ip: string | null, secret: string = serverEnv.bffSecret): Record<string, string> {
  if (!secret) return {};
  return { 'x-bff-secret': secret, ...(ip ? { 'x-bff-client-ip': ip } : {}) };
}

export async function proxyToBackend(req: Request, segments: string[]): Promise<Response> {
  const target = buildTargetPath(segments);
  if (!target) {
    return Response.json({ statusCode: 400, message: 'Ruta inválida.' }, { status: 400 });
  }
  const incoming = new URL(req.url);
  const url = `${serverEnv.apiBaseUrl}${serverEnv.apiPrefix}${target}${incoming.search}`;

  // Lista blanca: nunca se reenvían X-BFF-* ni X-Forwarded-For que vengan del navegador.
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  for (const [name, value] of Object.entries(bffTrustHeaders(clientIp(req.headers)))) headers.set(name, value);
  headers.set('x-forwarded-host', incoming.host);
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return Response.json(
      { statusCode: 502, message: 'No fue posible conectar con el servidor de la tienda.' },
      { status: 502 },
    );
  }

  const out = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  if (!out.has('cache-control')) out.set('cache-control', 'no-store');
  const secure = isSecureRequest(req.url, req.headers.get('x-forwarded-proto'));
  for (const cookie of getSetCookies(upstream.headers)) {
    out.append('set-cookie', rewriteSetCookie(cookie, { secure }));
  }

  const body = upstream.status === 204 || upstream.status === 304 ? null : await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: out });
}
