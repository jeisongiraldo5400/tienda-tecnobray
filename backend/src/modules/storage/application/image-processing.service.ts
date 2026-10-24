import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import sharp from 'sharp';
import { detectImageType, MAX_IMAGE_BYTES, type ImageType, type VariantSpec } from '../domain/image-types';

export interface ProcessedVariant {
  name: string;
  buffer: Buffer;
  width: number;
  height: number;
  contentType: string;
  extension: 'webp' | 'png';
}

/** Límite anti "bombas de descompresión" (≈ 40 megapíxeles). */
const MAX_INPUT_PIXELS = 40_000_000;

@Injectable()
export class ImageProcessingService {
  /** Valida tamaño y tipo real (magic bytes). Devuelve el tipo detectado. */
  validate(buffer: Buffer | undefined): ImageType {
    if (!buffer || buffer.length === 0) throw new BadRequestException('No se recibió ninguna imagen.');
    if (buffer.length > MAX_IMAGE_BYTES) throw new PayloadTooLargeException('La imagen supera el máximo de 5 MB.');
    const type = detectImageType(buffer);
    if (!type) throw new BadRequestException('Formato no permitido. Usa imágenes JPEG, PNG o WebP.');
    return type;
  }

  /**
   * Genera las variantes indicadas. Aplica la orientación EXIF y luego descarta
   * todos los metadatos (EXIF/GPS/ICC) — sharp no los conserva salvo que se pida.
   */
  async process(buffer: Buffer, variants: VariantSpec[]): Promise<ProcessedVariant[]> {
    this.validate(buffer);
    try {
      await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
    } catch {
      throw new BadRequestException('La imagen está dañada o no se puede leer.');
    }
    return Promise.all(
      variants.map(async (v) => {
        let pipeline = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
          .rotate()
          .resize({
            width: v.width,
            height: v.height,
            fit: v.fit,
            withoutEnlargement: v.fit === 'inside',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          });
        pipeline = v.format === 'png' ? pipeline.png({ compressionLevel: 9 }) : pipeline.webp({ quality: v.quality ?? 80 });
        const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
        return {
          name: v.name,
          buffer: data,
          width: info.width,
          height: info.height,
          contentType: v.format === 'png' ? 'image/png' : 'image/webp',
          extension: v.format,
        };
      }),
    );
  }
}
