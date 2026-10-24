import { NextResponse, type NextRequest } from 'next/server';
import {
  decideAdminRoute,
  mergeCookieHeader,
  refreshAdminSession,
  sessionConfigFromEnv,
} from '@/shared/server/admin-session';
import { clientIp } from '@/shared/server/client-ip';
import { isSecureRequest, rewriteSetCookie } from '@/shared/server/set-cookie';

/**
 * Protege /admin/*: sin sesión redirige al login; con access vencido pero refresh vigente,
 * renueva la sesión en el servidor antes de renderizar. La verificación real del usuario
 * (firma del JWT, rol, usuario activo) la hace el layout del panel con GET /auth/me.
 */
export async function proxy(request: NextRequest) {
  const cfg = sessionConfigFromEnv();
  const { pathname, search } = request.nextUrl;
  const decision = decideAdminRoute(pathname, request.cookies, cfg);

  if (decision === 'public') return NextResponse.next();
  if (decision === 'allow') {
    const headers = new Headers(request.headers);
    headers.set('x-admin-path', `${pathname}${search}`);
    return NextResponse.next({ request: { headers } });
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);

  if (decision === 'login') return NextResponse.redirect(loginUrl);

  const cookieHeader = request.headers.get('cookie') ?? '';
  const result = await refreshAdminSession(
    cookieHeader,
    request.cookies.get(cfg.csrfCookie)?.value,
    cfg,
    fetch,
    clientIp(request.headers),
  );
  if (!result.ok) {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(cfg.refreshCookie);
    return res;
  }

  const headers = new Headers(request.headers);
  headers.set('cookie', mergeCookieHeader(cookieHeader, result.setCookies));
  headers.set('x-admin-path', `${pathname}${search}`);
  const res = NextResponse.next({ request: { headers } });
  const secure = isSecureRequest(request.url, request.headers.get('x-forwarded-proto'));
  result.setCookies.forEach((c) => res.headers.append('set-cookie', rewriteSetCookie(c, { secure })));
  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};
