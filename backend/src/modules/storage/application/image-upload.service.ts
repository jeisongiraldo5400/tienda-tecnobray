import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { IMAGE_PRESETS, type ImagePresetName } from '../domain/image-types';
import { STORAGE, type StoragePort } from '../domain/storage.port';
import { ImageProcessingService } from './image-processing.service';

/** Los objetos son inmutables (llave con UUID): se pueden cachear un año. */
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export interface UploadedImage {
  /** Llaves por variante, p. ej. { '1600': 'public/products/<id>/1600.webp', '400': ... } */
  keys: Record<string, string>;
  /** Variante grande (primera del preset) y miniatura (segunda). */
  largeKey: string;
  thumbKey: string;
  width: number;
  height: number;
}

export interface UploadOptions {
  /** true para datos de demostración: se guardan bajo public/demo/... para borrarlos fácil. */
  demo?: boolean;
}

@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);

  constructor(
    @Inject(STORAGE) private readonly storage: StoragePort,
    private readonly processing: ImageProcessingService,
  ) {}

  async upload(buffer: Buffer, presetName: ImagePresetName, opts: UploadOptions = {}): Promise<UploadedImage> {
    const preset = IMAGE_PRESETS[presetName];
    const variants = await this.processing.process(buffer, preset.variants);
    const base = `public/${opts.demo ? 'demo/' : ''}${preset.folder}/${randomUUID()}`;
    const keys: Record<string, string> = {};
    const written: string[] = [];
    try {
      for (const v of variants) {
        const key = `${base}/${v.name}.${v.extension}`;
        await this.storage.putObject({ key, body: v.buffer, contentType: v.contentType, cacheControl: IMMUTABLE_CACHE_CONTROL });
        keys[v.name] = key;
        written.push(key);
      }
    } catch (err) {
      await this.storage.deleteObjects(written);
      this.logger.error(`Fallo al subir imagen a S3: ${(err as Error).message}`);
      throw err;
    }
    const [large, thumb] = variants;
    return {
      keys,
      largeKey: keys[large.name],
      thumbKey: keys[(thumb ?? large).name],
      width: large.width,
      height: large.height,
    };
  }

  /** Borrado "best effort": nunca falla la operación de negocio, solo registra. */
  async remove(keys: Array<string | null | undefined>): Promise<void> {
    const list = keys.filter((k): k is string => !!k);
    if (!list.length) return;
    try {
      await this.storage.deleteObjects(list);
      this.logger.log(`Objetos eliminados de S3: ${list.length}`);
    } catch (err) {
      this.logger.warn(`No se pudieron borrar objetos de S3 (${list.join(', ')}): ${(err as Error).message}`);
    }
  }
}
