import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from '../../../config/config.module';
import type { AppConfig } from '../../../config/app-config';
import { S3_SETTINGS } from '../storage.tokens';
import type { S3Settings } from '../infrastructure/s3-config';

/**
 * Construye URLs públicas a partir de llaves:
 * - public:   ${S3_PUBLIC_BASE_URL}/${S3_PREFIX}${key}   (CloudFront o bucket público)
 * - proxy/redirect: ${PUBLIC_API_URL}/api/media/${key}  (bucket privado; el backend sirve o firma)
 */
@Injectable()
export class MediaUrlService {
  constructor(
    @Inject(S3_SETTINGS) private readonly s3: S3Settings,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  url(key: string | null | undefined): string | null {
    if (!key) return null;
    if (this.s3.delivery === 'public' && this.s3.publicBaseUrl) {
      return `${this.s3.publicBaseUrl}/${this.s3.prefix}${key}`;
    }
    return `${this.cfg.publicApiUrl}/api/media/${key}`;
  }
}
