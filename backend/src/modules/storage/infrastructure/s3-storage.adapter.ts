import {
  DeleteObjectsCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Logger } from '@nestjs/common';
import type { Readable } from 'node:stream';
import type { PutObjectInput, StoragePort, StoredObject } from '../domain/storage.port';
import type { S3Settings } from './s3-config';

export function createS3Client(s: S3Settings): S3Client {
  return new S3Client({
    region: s.region,
    endpoint: s.endpoint,
    forcePathStyle: s.forcePathStyle,
    credentials: { accessKeyId: s.accessKeyId, secretAccessKey: s.secretAccessKey },
  });
}

/** Adaptador S3 (AWS S3, Cloudflare R2, MinIO). */
export class S3StorageAdapter implements StoragePort {
  private readonly logger = new Logger(S3StorageAdapter.name);

  constructor(
    private readonly settings: S3Settings,
    private readonly client: S3Client = createS3Client(settings),
  ) {}

  /** Llave física en el bucket: S3_PREFIX + llave lógica. */
  fullKey(key: string): string {
    return `${this.settings.prefix}${key.replace(/^\/+/, '')}`;
  }

  async putObject(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.settings.bucket,
        Key: this.fullKey(input.key),
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        ContentLength: input.body.length,
      }),
    );
  }

  async getObject(key: string): Promise<StoredObject | null> {
    try {
      const out = await this.client.send(new GetObjectCommand({ Bucket: this.settings.bucket, Key: this.fullKey(key) }));
      if (!out.Body) return null;
      return {
        body: out.Body as Readable,
        contentType: out.ContentType,
        contentLength: out.ContentLength,
        etag: out.ETag,
        lastModified: out.LastModified,
      };
    } catch (err) {
      if (err instanceof NoSuchKey) return null;
      if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) return null;
      throw err;
    }
  }

  /** Borrado en lote (máx. 1000 por solicitud). Los errores se registran y no se propagan. */
  async deleteObjects(keys: string[]): Promise<void> {
    const unique = [...new Set(keys.filter(Boolean))];
    for (let i = 0; i < unique.length; i += 1000) {
      const chunk = unique.slice(i, i + 1000);
      try {
        const out = await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.settings.bucket,
            Delete: { Objects: chunk.map((k) => ({ Key: this.fullKey(k) })), Quiet: true },
          }),
        );
        for (const e of out.Errors ?? []) this.logger.warn(`No se pudo borrar ${e.Key}: ${e.Code} ${e.Message}`);
      } catch (err) {
        this.logger.warn(`Fallo al borrar ${chunk.length} objeto(s) de S3: ${(err as Error).message}`);
      }
    }
  }

  presignGet(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.settings.bucket, Key: this.fullKey(key) }),
      { expiresIn: expiresInSeconds },
    );
  }
}
