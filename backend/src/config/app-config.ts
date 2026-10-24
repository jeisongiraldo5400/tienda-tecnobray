/** Lectura tipada de la configuración (después de validateEnv). */
export interface AppConfig {
  port: number;
  isProduction: boolean;
  frontendOrigins: string[];
  frontendUrl: string | null;
  revalidateSecret: string | null;
  publicApiUrl: string;
  trustProxy: string | number | boolean;
  cookieSecure: boolean;
  cookieDomain: string | undefined;
  refreshCookiePath: string | undefined;
  jwt: { accessSecret: string; refreshSecret: string; accessTtlSeconds: number; refreshTtlDays: number };
}

export function readAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProduction = env.NODE_ENV === 'production';
  const port = Number(env.PORT ?? 4001);
  // Sin confianza general en proxies: la IP real detrás del BFF llega con X-BFF-Secret (ver client-ip.ts).
  const trust = env.TRUST_PROXY ?? 'false';
  return {
    port,
    isProduction,
    frontendOrigins: (env.FRONTEND_ORIGIN ?? 'http://localhost:3002')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    frontendUrl: env.FRONTEND_URL?.trim() || null,
    revalidateSecret: env.REVALIDATE_SECRET?.trim() || null,
    publicApiUrl: (env.PUBLIC_API_URL ?? `http://localhost:${port}`).replace(/\/+$/, ''),
    trustProxy: /^\d+$/.test(trust) ? Number(trust) : trust === 'true' ? true : trust === 'false' ? false : trust,
    cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProduction,
    cookieDomain: env.COOKIE_DOMAIN?.trim() || undefined,
    refreshCookiePath: env.REFRESH_COOKIE_PATH?.trim() || undefined,
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET ?? '',
      refreshSecret: env.JWT_REFRESH_SECRET ?? '',
      accessTtlSeconds: Number(env.JWT_ACCESS_TTL_SECONDS ?? 900),
      refreshTtlDays: Number(env.JWT_REFRESH_TTL_DAYS ?? 7),
    },
  };
}
