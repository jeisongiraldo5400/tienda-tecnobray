import sharp from 'sharp';
import { InMemoryStorageAdapter } from '../infrastructure/in-memory-storage.adapter';
import { ImageProcessingService } from './image-processing.service';
import { IMMUTABLE_CACHE_CONTROL, ImageUploadService } from './image-upload.service';

const png = () => sharp({ create: { width: 800, height: 800, channels: 3, background: '#123456' } }).png().toBuffer();

describe('ImageUploadService', () => {
  it('sube las variantes con llaves public/<carpeta>/<uuid>/<variante>.webp', async () => {
    const storage = new InMemoryStorageAdapter();
    const svc = new ImageUploadService(storage, new ImageProcessingService());
    const up = await svc.upload(await png(), 'product');
    expect(up.largeKey).toMatch(/^public\/products\/[0-9a-f-]{36}\/1600\.webp$/);
    expect(up.thumbKey).toMatch(/^public\/products\/[0-9a-f-]{36}\/400\.webp$/);
    expect(storage.objects.get(up.largeKey)).toMatchObject({ contentType: 'image/webp', cacheControl: IMMUTABLE_CACHE_CONTROL });
    expect(storage.objects.size).toBe(2);
  });

  it('usa public/demo/ para datos de demostración', async () => {
    const storage = new InMemoryStorageAdapter();
    const svc = new ImageUploadService(storage, new ImageProcessingService());
    const up = await svc.upload(await png(), 'banner', { demo: true });
    expect(up.largeKey).toMatch(/^public\/demo\/banners\//);
  });

  it('si falla una subida, borra lo ya subido', async () => {
    const storage = new InMemoryStorageAdapter();
    let calls = 0;
    const original = storage.putObject.bind(storage);
    storage.putObject = async (input) => {
      if (++calls === 2) throw new Error('S3 caído');
      return original(input);
    };
    const svc = new ImageUploadService(storage, new ImageProcessingService());
    await expect(svc.upload(await png(), 'product')).rejects.toThrow('S3 caído');
    expect(storage.objects.size).toBe(0);
    expect(storage.deleted).toHaveLength(1);
  });

  it('remove es best-effort e ignora vacíos', async () => {
    const storage = new InMemoryStorageAdapter();
    storage.deleteObjects = vi.fn().mockRejectedValue(new Error('sin permiso'));
    const svc = new ImageUploadService(storage, new ImageProcessingService());
    await expect(svc.remove(['a', null, undefined])).resolves.toBeUndefined();
    await svc.remove([null]);
    expect(storage.deleteObjects).toHaveBeenCalledTimes(1);
  });
});
