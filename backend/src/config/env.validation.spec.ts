import { EnvValidationError, validateEnv } from './env.validation';

const base = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'db',
  DB_USERNAME: 'u',
  DB_PASSWORD: 'p',
  JWT_ACCESS_SECRET: 'a'.repeat(40),
  JWT_REFRESH_SECRET: 'b'.repeat(40),
  FRONTEND_ORIGIN: 'http://localhost:3002',
  AWS_REGION: 'us-east-1',
  S3_BUCKET_NAME: 'bucket',
  AWS_ACCESS_KEY_ID: 'id',
  AWS_SECRET_ACCESS_KEY: 'secret',
};

describe('validateEnv', () => {
  it('acepta una configuración completa', () => {
    expect(validateEnv({ ...base })).toBeTruthy();
  });

  it('falla rápido si falta S3', () => {
    const { S3_BUCKET_NAME: _b, AWS_ACCESS_KEY_ID: _k, ...rest } = base;
    expect(() => validateEnv(rest)).toThrow(/S3_BUCKET_NAME, AWS_ACCESS_KEY_ID/);
  });

  it('exige secretos JWT largos y distintos', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'corto' })).toThrow(EnvValidationError);
    expect(() => validateEnv({ ...base, JWT_REFRESH_SECRET: base.JWT_ACCESS_SECRET })).toThrow(/distintos/);
  });

  it('MEDIA_DELIVERY=public requiere S3_PUBLIC_BASE_URL', () => {
    expect(() => validateEnv({ ...base, MEDIA_DELIVERY: 'public' })).toThrow(/S3_PUBLIC_BASE_URL/);
  });
});
