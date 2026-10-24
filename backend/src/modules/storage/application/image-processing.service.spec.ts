import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import sharp from 'sharp';
import { IMAGE_PRESETS } from '../domain/image-types';
import { ImageProcessingService } from './image-processing.service';

const jpegWithExif = () =>
  sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#0f62fe' } })
    .jpeg()
    .withMetadata({ exif: { IFD0: { Copyright: 'secreto', Artist: 'GPS-123' } } })
    .toBuffer();

describe('ImageProcessingService', () => {
  const svc = new ImageProcessingService();

  it('genera variantes WebP redimensionadas y sin EXIF', async () => {
    const out = await svc.process(await jpegWithExif(), IMAGE_PRESETS.product.variants);
    expect(out.map((v) => v.name)).toEqual(['1600', '400']);
    expect(out[0]).toMatchObject({ width: 1600, height: 1067, contentType: 'image/webp' });
    expect(out[1].width).toBe(400);
    for (const v of out) {
      const meta = await sharp(v.buffer).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.exif).toBeUndefined();
    }
  });

  it('no agranda imágenes pequeñas', async () => {
    const small = await sharp({ create: { width: 300, height: 200, channels: 3, background: '#fff' } }).png().toBuffer();
    const out = await svc.process(small, IMAGE_PRESETS.product.variants);
    expect(out[0].width).toBe(300);
  });

  it('genera favicon PNG cuadrado', async () => {
    const png = await sharp({ create: { width: 500, height: 300, channels: 4, background: '#f00' } }).png().toBuffer();
    const out = await svc.process(png, IMAGE_PRESETS.favicon.variants);
    expect(out[0]).toMatchObject({ width: 64, height: 64, contentType: 'image/png' });
  });

  it('rechaza archivos que no son JPEG/PNG/WebP', () => {
    expect(() => svc.validate(Buffer.from('GIF89a aaaaaaaaaaaaaaaa'))).toThrow(BadRequestException);
    expect(() => svc.validate(Buffer.alloc(0))).toThrow(BadRequestException);
  });

  it('rechaza archivos de más de 5 MB', () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1);
    big[0] = 0xff;
    big[1] = 0xd8;
    big[2] = 0xff;
    expect(() => svc.validate(big)).toThrow(PayloadTooLargeException);
  });

  it('rechaza imágenes corruptas con cabecera válida', async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100, 1)]);
    await expect(svc.process(fake, IMAGE_PRESETS.product.variants)).rejects.toThrow(BadRequestException);
  });
});
