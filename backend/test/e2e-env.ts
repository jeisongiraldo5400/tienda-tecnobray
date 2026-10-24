/**
 * Entorno fijo de las pruebas e2e: Postgres y MinIO de docker-compose (perfil "test").
 * Nunca apunta a Railway ni a AWS: estos valores reemplazan cualquier variable del sistema.
 */
export const E2E_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '0',
  DB_HOST: '127.0.0.1',
  DB_PORT: '55440',
  DB_NAME: 'tecnobray_tienda_test',
  DB_USERNAME: 'tecnobray',
  DB_PASSWORD: 'tecnobray_dev',
  DB_SSL: 'false',
  DB_SSL_CA_FILE: '',
  DB_SSL_SERVERNAME: '',
  AWS_ACCESS_KEY_ID: 'tecnobray-dev',
  AWS_SECRET_ACCESS_KEY: 'tecnobray-dev-secret',
  AWS_REGION: 'us-east-1',
  S3_BUCKET_NAME: 'tecnobray-media',
  S3_PREFIX: 'e2e',
  S3_ENDPOINT: 'http://127.0.0.1:9010',
  S3_FORCE_PATH_STYLE: 'true',
  S3_PUBLIC_BASE_URL: '',
  MEDIA_DELIVERY: 'proxy',
  JWT_ACCESS_SECRET: 'e2e-access-secret-0123456789-abcdefghijklmnop',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret-0123456789-abcdefghijklmnop',
  FRONTEND_ORIGIN: 'http://localhost:3002',
  FRONTEND_URL: '',
  REVALIDATE_SECRET: '',
  PUBLIC_API_URL: 'http://localhost:4001',
  COOKIE_SECURE: 'false',
  TRUST_PROXY: 'false',
  BFF_SHARED_SECRET: 'e2e-bff-shared-secret-0123456789abcdef',
};

export function applyE2eEnv(): void {
  for (const [k, v] of Object.entries(E2E_ENV)) process.env[k] = v;
}
