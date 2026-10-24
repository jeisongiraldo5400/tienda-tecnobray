import { normalizePrefix, readS3Settings } from './s3-config';

const env = {
  AWS_REGION: 'us-east-1',
  S3_BUCKET_NAME: 'tecnobray',
  AWS_ACCESS_KEY_ID: 'AKIATEST',
  AWS_SECRET_ACCESS_KEY: 'secret',
};

describe('readS3Settings', () => {
  it('falla rápido con un mensaje claro si faltan variables', () => {
    expect(() => readS3Settings({ AWS_REGION: 'us-east-1' })).toThrow(/S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY/);
  });

  it('usa proxy por defecto y public cuando hay S3_PUBLIC_BASE_URL', () => {
    expect(readS3Settings(env).delivery).toBe('proxy');
    const s = readS3Settings({ ...env, S3_PUBLIC_BASE_URL: 'https://cdn.tecnobray.co/' });
    expect(s.delivery).toBe('public');
    expect(s.publicBaseUrl).toBe('https://cdn.tecnobray.co');
  });

  it('lee endpoint y path-style para MinIO/R2', () => {
    const s = readS3Settings({ ...env, S3_ENDPOINT: 'http://127.0.0.1:9010', S3_FORCE_PATH_STYLE: 'true' });
    expect(s.endpoint).toBe('http://127.0.0.1:9010');
    expect(s.forcePathStyle).toBe(true);
  });

  it('normaliza el prefijo', () => {
    expect(normalizePrefix('')).toBe('');
    expect(normalizePrefix(undefined)).toBe('');
    expect(normalizePrefix('/tienda/')).toBe('tienda/');
    expect(normalizePrefix('tienda')).toBe('tienda/');
  });
});
