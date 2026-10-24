/** Variables públicas (disponibles en el navegador). */
export const publicEnv = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002').replace(/\/+$/, ''),
  /** Ruta del BFF (route handlers de Next que reenvían al backend). */
  bffBase: '/api/bff',
  csrfCookie: process.env.NEXT_PUBLIC_CSRF_COOKIE || 'tb_csrf',
  csrfHeader: process.env.NEXT_PUBLIC_CSRF_HEADER || 'x-csrf-token',
};
