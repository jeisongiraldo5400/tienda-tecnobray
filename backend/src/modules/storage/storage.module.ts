import { Global, Module } from '@nestjs/common';
import { ImageProcessingService } from './application/image-processing.service';
import { ImageUploadService } from './application/image-upload.service';
import { MediaUrlService } from './application/media-url.service';
import { STORAGE } from './domain/storage.port';
import { MediaController } from './infrastructure/http/media.controller';
import { readS3Settings, type S3Settings } from './infrastructure/s3-config';
import { S3StorageAdapter } from './infrastructure/s3-storage.adapter';
import { S3_SETTINGS } from './storage.tokens';

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    { provide: S3_SETTINGS, useFactory: () => readS3Settings() },
    { provide: STORAGE, useFactory: (s: S3Settings) => new S3StorageAdapter(s), inject: [S3_SETTINGS] },
    ImageProcessingService,
    ImageUploadService,
    MediaUrlService,
  ],
  exports: [STORAGE, S3_SETTINGS, ImageProcessingService, ImageUploadService, MediaUrlService],
})
export class StorageModule {}
