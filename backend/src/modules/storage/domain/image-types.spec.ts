import { detectImageType, PUBLIC_MEDIA_KEY } from './image-types';

describe('detectImageType (magic bytes)', () => {
  const pad = (b: number[]) => Buffer.from([...b, ...new Array(16).fill(0)]);
  it('detecta JPEG, PNG y WebP', () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(detectImageType(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]))).toBe('webp');
  });
  it('rechaza otros formatos aunque la extensión diga imagen', () => {
    expect(detectImageType(Buffer.from('GIF89a........'))).toBeNull();
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectImageType(Buffer.from('%PDF-1.7 ......'))).toBeNull();
    expect(detectImageType(Buffer.alloc(3))).toBeNull();
  });
});

describe('PUBLIC_MEDIA_KEY', () => {
  it('acepta solo llaves públicas generadas', () => {
    expect(PUBLIC_MEDIA_KEY.test('public/products/7b1c2f9e-1111-4c1d-8f00-123456789abc/1600.webp')).toBe(true);
    expect(PUBLIC_MEDIA_KEY.test('public/demo/settings/favicon/abc/64.png')).toBe(true);
    expect(PUBLIC_MEDIA_KEY.test('private/x/1.webp')).toBe(false);
    expect(PUBLIC_MEDIA_KEY.test('public/../secret.webp')).toBe(false);
    expect(PUBLIC_MEDIA_KEY.test('public/products/a/1.jpg')).toBe(false);
  });
});
