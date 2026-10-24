import type { Readable } from 'node:stream';

/** Token de inyección del puerto de almacenamiento. */
export const STORAGE = Symbol('STORAGE');

export interface PutObjectInput {
  /** Llave lógica (sin S3_PREFIX), p. ej. `public/products/<uuid>/1600.webp`. */
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl: string;
}

export interface StoredObject {
  body: Readable;
  contentType?: string;
  contentLength?: number;
  etag?: string;
  lastModified?: Date;
}

/**
 * Puerto de almacenamiento de objetos. Implementaciones:
 * - S3StorageAdapter (AWS S3, Cloudflare R2, MinIO): la real, en todos los entornos.
 * - InMemoryStorageAdapter: solo para pruebas.
 * Todas las llaves son lógicas; el adaptador antepone S3_PREFIX.
 */
export interface StoragePort {
  putObject(input: PutObjectInput): Promise<void>;
  getObject(key: string): Promise<StoredObject | null>;
  deleteObjects(keys: string[]): Promise<void>;
  /** URL GET firmada de corta duración (para MEDIA_DELIVERY=redirect). */
  presignGet(key: string, expiresInSeconds: number): Promise<string>;
}
