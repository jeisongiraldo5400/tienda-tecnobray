import { Readable } from 'node:stream';
import type { PutObjectInput, StoragePort, StoredObject } from '../domain/storage.port';

/** Implementación en memoria del puerto. SOLO para pruebas unitarias. */
export class InMemoryStorageAdapter implements StoragePort {
  readonly objects = new Map<string, { body: Buffer; contentType: string; cacheControl: string }>();
  readonly deleted: string[] = [];

  async putObject(input: PutObjectInput): Promise<void> {
    this.objects.set(input.key, { body: input.body, contentType: input.contentType, cacheControl: input.cacheControl });
  }

  async getObject(key: string): Promise<StoredObject | null> {
    const o = this.objects.get(key);
    if (!o) return null;
    return { body: Readable.from(o.body), contentType: o.contentType, contentLength: o.body.length, etag: `"${key.length}"` };
  }

  async deleteObjects(keys: string[]): Promise<void> {
    for (const k of keys) {
      this.objects.delete(k);
      this.deleted.push(k);
    }
  }

  async presignGet(key: string, expiresInSeconds: number): Promise<string> {
    return `https://memory.local/${key}?expires=${expiresInSeconds}`;
  }
}
