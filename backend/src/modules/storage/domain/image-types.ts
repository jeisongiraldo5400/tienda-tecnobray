export type ImageType = 'jpeg' | 'png' | 'webp';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Detecta el tipo real por "magic bytes" (no confía en la extensión ni en el Content-Type). */
export function detectImageType(buf: Buffer): ImageType | null {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return 'png';
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Solo se sirven llaves públicas generadas por el sistema (sin "..", sin rutas raras). */
export const PUBLIC_MEDIA_KEY = /^public\/(?:[a-z0-9_-]+\/){1,4}[a-z0-9_-]+\.(?:webp|png)$/;

export interface VariantSpec {
  name: string;
  width: number;
  height: number;
  fit: 'inside' | 'cover' | 'contain';
  format: 'webp' | 'png';
  quality?: number;
}

export type ImagePresetName = 'product' | 'category' | 'banner' | 'brand' | 'logo' | 'favicon';

export const IMAGE_PRESETS: Record<ImagePresetName, { folder: string; variants: VariantSpec[] }> = {
  product: {
    folder: 'products',
    variants: [
      { name: '1600', width: 1600, height: 1600, fit: 'inside', format: 'webp', quality: 82 },
      { name: '400', width: 400, height: 400, fit: 'inside', format: 'webp', quality: 78 },
    ],
  },
  category: {
    folder: 'categories',
    variants: [
      { name: '800', width: 800, height: 800, fit: 'inside', format: 'webp', quality: 80 },
      { name: '400', width: 400, height: 400, fit: 'inside', format: 'webp', quality: 78 },
    ],
  },
  banner: {
    folder: 'banners',
    variants: [
      { name: '1920', width: 1920, height: 1080, fit: 'inside', format: 'webp', quality: 82 },
      { name: '640', width: 640, height: 640, fit: 'inside', format: 'webp', quality: 78 },
    ],
  },
  brand: {
    folder: 'brands',
    variants: [
      { name: '400', width: 400, height: 400, fit: 'inside', format: 'webp', quality: 85 },
      { name: '200', width: 200, height: 200, fit: 'inside', format: 'webp', quality: 85 },
    ],
  },
  logo: {
    folder: 'settings/logo',
    variants: [
      { name: '512', width: 512, height: 512, fit: 'inside', format: 'webp', quality: 90 },
      { name: '192', width: 192, height: 192, fit: 'inside', format: 'webp', quality: 90 },
    ],
  },
  favicon: {
    folder: 'settings/favicon',
    variants: [
      { name: '64', width: 64, height: 64, fit: 'contain', format: 'png' },
      { name: '180', width: 180, height: 180, fit: 'contain', format: 'png' },
    ],
  },
};
