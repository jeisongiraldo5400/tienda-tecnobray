/**
 * Validación de variables de entorno al arrancar (fail fast).
 * Lanza un error con la lista completa de problemas para que el despliegue falle
 * con un mensaje claro en lugar de fallar más tarde en tiempo de ejecución.
 */
export class EnvValidationError extends Error {}

const REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USERNAME',
  'DB_PASSWORD',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_ORIGIN',
] as const;

const REQUIRED_S3 = ['AWS_REGION', 'S3_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'] as const;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];
  const get = (k: string) => (typeof config[k] === 'string' ? (config[k] as string).trim() : '');

  for (const key of REQUIRED) if (!get(key)) errors.push(`Falta la variable ${key}`);

  const missingS3 = REQUIRED_S3.filter((k) => !get(k));
  if (missingS3.length) {
    errors.push(
      `Almacenamiento S3 sin configurar: faltan ${missingS3.join(', ')}. ` +
        'Todas las imágenes se guardan en S3 (AWS, R2 o MinIO con S3_ENDPOINT).',
    );
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (get(key) && get(key).length < 32) errors.push(`${key} debe tener al menos 32 caracteres`);
  }
  if (get('JWT_ACCESS_SECRET') && get('JWT_ACCESS_SECRET') === get('JWT_REFRESH_SECRET')) {
    errors.push('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
  }
  if (get('DB_PORT') && !/^\d+$/.test(get('DB_PORT'))) errors.push('DB_PORT debe ser numérico');
  const mode = get('MEDIA_DELIVERY');
  if (mode && !['proxy', 'redirect', 'public'].includes(mode)) {
    errors.push('MEDIA_DELIVERY debe ser proxy, redirect o public');
  }
  if (mode === 'public' && !get('S3_PUBLIC_BASE_URL')) {
    errors.push('MEDIA_DELIVERY=public requiere S3_PUBLIC_BASE_URL (CloudFront o URL pública del bucket)');
  }

  if (errors.length) {
    throw new EnvValidationError(`Configuración inválida:\n - ${errors.join('\n - ')}`);
  }
  return config;
}
