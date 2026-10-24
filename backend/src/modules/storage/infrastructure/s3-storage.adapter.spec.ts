import { DeleteObjectsCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'node:stream';
import type { S3Settings } from './s3-config';
import { S3StorageAdapter } from './s3-storage.adapter';

const settings: S3Settings = {
  bucket: 'tecnobray',
  region: 'us-east-1',
  accessKeyId: 'id',
  secretAccessKey: 'secret',
  forcePathStyle: false,
  prefix: 'tienda/',
  delivery: 'proxy',
};

function mockClient() {
  const send = vi.fn();
  return { client: { send } as unknown as S3Client, send };
}

describe('S3StorageAdapter', () => {
  it('sube con prefijo, content-type y cache-control', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValue({});
    const adapter = new S3StorageAdapter(settings, client);
    await adapter.putObject({ key: 'public/products/a/1600.webp', body: Buffer.from('x'), contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' });
    const cmd = send.mock.calls[0][0] as PutObjectCommand;
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input).toMatchObject({
      Bucket: 'tecnobray',
      Key: 'tienda/public/products/a/1600.webp',
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      ContentLength: 1,
    });
  });

  it('getObject devuelve null si la llave no existe', async () => {
    const { client, send } = mockClient();
    send.mockRejectedValue(new NoSuchKey({ message: 'no', $metadata: {} }));
    const adapter = new S3StorageAdapter(settings, client);
    await expect(adapter.getObject('public/x.webp')).resolves.toBeNull();
  });

  it('getObject devuelve el cuerpo y metadatos', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValue({ Body: Readable.from(Buffer.from('img')), ContentType: 'image/webp', ETag: '"e"', ContentLength: 3 });
    const adapter = new S3StorageAdapter(settings, client);
    const obj = await adapter.getObject('public/x.webp');
    expect((send.mock.calls[0][0] as GetObjectCommand).input.Key).toBe('tienda/public/x.webp');
    expect(obj).toMatchObject({ contentType: 'image/webp', etag: '"e"', contentLength: 3 });
  });

  it('borra en lotes de 1000, sin duplicados y sin propagar errores', async () => {
    const { client, send } = mockClient();
    send.mockResolvedValueOnce({ Errors: [{ Key: 'k', Code: 'AccessDenied' }] }).mockRejectedValueOnce(new Error('red'));
    const adapter = new S3StorageAdapter(settings, client);
    const keys = Array.from({ length: 1500 }, (_, i) => `public/k${i}.webp`);
    await expect(adapter.deleteObjects([...keys, keys[0], ''])).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(2);
    const first = send.mock.calls[0][0] as DeleteObjectsCommand;
    expect(first.input.Delete?.Objects).toHaveLength(1000);
    expect(first.input.Delete?.Objects?.[0].Key).toBe('tienda/public/k0.webp');
  });
});
