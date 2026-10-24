export type MediaDelivery = 'proxy' | 'redirect' | 'public';

export interface S3Settings {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  forcePathStyle: boolean;
  /** Prefijo opcional antepuesto a todas las llaves (termina en "/"). */
  prefix: string;
  publicBaseUrl?: string;
  delivery: MediaDelivery;
}

export function normalizePrefix(prefix: string | undefined): string {
  const p = (prefix ?? '').trim().replace(/^\/+|\/+$/g, '');
  return p ? `${p}/` : '';
}

/** Lee la configuración S3 con los nombres de variables del proyecto. Falla rápido si falta algo. */
export function readS3Settings(env: NodeJS.ProcessEnv = process.env): S3Settings {
  const missing = ['AWS_REGION', 'S3_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter(
    (k) => !env[k]?.trim(),
  );
  if (missing.length) {
    throw new Error(
      `Almacenamiento S3 sin configurar: faltan ${missing.join(', ')}. ` +
        'Define las credenciales de AWS (o de MinIO/R2 con S3_ENDPOINT) en backend/.env.',
    );
  }
  const publicBaseUrl = env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') || undefined;
  const delivery = (env.MEDIA_DELIVERY?.trim() as MediaDelivery | undefined) || (publicBaseUrl ? 'public' : 'proxy');
  return {
    bucket: env.S3_BUCKET_NAME!.trim(),
    region: env.AWS_REGION!.trim(),
    accessKeyId: env.AWS_ACCESS_KEY_ID!.trim(),
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!.trim(),
    endpoint: env.S3_ENDPOINT?.trim() || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
    prefix: normalizePrefix(env.S3_PREFIX),
    publicBaseUrl,
    delivery,
  };
}
