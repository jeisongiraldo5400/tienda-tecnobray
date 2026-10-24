import { Controller, Get, Headers, Inject, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { IMMUTABLE_CACHE_CONTROL } from '../../application/image-upload.service';
import { PUBLIC_MEDIA_KEY } from '../../domain/image-types';
import { STORAGE, type StoragePort } from '../../domain/storage.port';
import { S3_SETTINGS } from '../../storage.tokens';
import type { S3Settings } from '../s3-config';

const PRESIGN_TTL_SECONDS = 3600;

/**
 * Entrega de imágenes cuando el bucket es privado.
 * - proxy (por defecto): el backend lee el objeto de S3 y lo transmite con caché larga.
 * - redirect: 302 a una URL firmada de corta duración (cacheada en memoria).
 * - public: 301 a S3_PUBLIC_BASE_URL.
 */
@ApiTags('Medios')
@SkipThrottle()
@Controller('media')
export class MediaController {
  private readonly signed = new Map<string, { url: string; expiresAt: number }>();

  constructor(
    @Inject(STORAGE) private readonly storage: StoragePort,
    @Inject(S3_SETTINGS) private readonly s3: S3Settings,
  ) {}

  @Get('*key')
  @ApiOperation({ summary: 'Imagen pública por llave (public/...)' })
  async get(
    @Param('key') rawKey: string | string[],
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;
    if (!PUBLIC_MEDIA_KEY.test(key) || key.includes('..')) throw new NotFoundException('Imagen no encontrada.');

    if (this.s3.delivery === 'public' && this.s3.publicBaseUrl) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.redirect(301, `${this.s3.publicBaseUrl}/${this.s3.prefix}${key}`);
    }

    if (this.s3.delivery === 'redirect') {
      const now = Date.now();
      let entry = this.signed.get(key);
      if (!entry || entry.expiresAt - now < 10 * 60 * 1000) {
        entry = { url: await this.storage.presignGet(key, PRESIGN_TTL_SECONDS), expiresAt: now + PRESIGN_TTL_SECONDS * 1000 };
        this.signed.set(key, entry);
        if (this.signed.size > 5000) this.signed.clear();
      }
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.redirect(302, entry.url);
    }

    const obj = await this.storage.getObject(key);
    if (!obj) throw new NotFoundException('Imagen no encontrada.');
    if (obj.etag && ifNoneMatch === obj.etag) {
      obj.body.destroy();
      res.status(304).end();
      return;
    }
    res.setHeader('Content-Type', obj.contentType ?? 'application/octet-stream');
    res.setHeader('Cache-Control', IMMUTABLE_CACHE_CONTROL);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (obj.etag) res.setHeader('ETag', obj.etag);
    if (obj.contentLength) res.setHeader('Content-Length', String(obj.contentLength));
    if (obj.lastModified) res.setHeader('Last-Modified', obj.lastModified.toUTCString());
    obj.body.on('error', () => res.destroy());
    obj.body.pipe(res);
  }
}
