import { readAppConfig } from '../../../config/app-config';
import type { S3Settings } from '../infrastructure/s3-config';
import { MediaUrlService } from './media-url.service';

const s3 = (over: Partial<S3Settings> = {}): S3Settings => ({
  bucket: 'b',
  region: 'us-east-1',
  accessKeyId: 'i',
  secretAccessKey: 's',
  forcePathStyle: false,
  prefix: '',
  delivery: 'proxy',
  ...over,
});

describe('MediaUrlService', () => {
  const cfg = readAppConfig({ PUBLIC_API_URL: 'https://api.tecnobray.co/' });

  it('en modo proxy apunta al backend', () => {
    expect(new MediaUrlService(s3(), cfg).url('public/a/1.webp')).toBe('https://api.tecnobray.co/api/media/public/a/1.webp');
  });

  it('en modo public usa la URL del CDN con el prefijo', () => {
    const svc = new MediaUrlService(s3({ delivery: 'public', publicBaseUrl: 'https://cdn.x.co', prefix: 'tienda/' }), cfg);
    expect(svc.url('public/a/1.webp')).toBe('https://cdn.x.co/tienda/public/a/1.webp');
  });

  it('devuelve null sin llave', () => {
    expect(new MediaUrlService(s3(), cfg).url(null)).toBeNull();
  });
});
