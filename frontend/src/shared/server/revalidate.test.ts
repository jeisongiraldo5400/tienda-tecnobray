import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRevalidatePlan, extractSecret, secretMatches } from './revalidate';

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag: (...a: unknown[]) => revalidateTag(...a), revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));

describe('revalidación', () => {
  it('compara el secreto en tiempo constante', () => {
    expect(secretMatches('abc', 'abc')).toBe(true);
    expect(secretMatches('abd', 'abc')).toBe(false);
    expect(secretMatches('', 'abc')).toBe(false);
    expect(secretMatches('abc', '')).toBe(false);
  });

  it('lee el secreto de x-revalidate-secret o Authorization Bearer', () => {
    expect(extractSecret(new Request('http://x', { headers: { 'x-revalidate-secret': 's1' } }))).toBe('s1');
    expect(extractSecret(new Request('http://x', { headers: { authorization: 'Bearer s2' } }))).toBe('s2');
  });

  it('acepta tags del backend y descarta valores inválidos', () => {
    const plan = buildRevalidatePlan({ tags: ['products', 'product:celular-x', 'home', 42, '<script>'], paths: ['/', '//evil', '/../x'] });
    expect(plan.tags).toEqual(['products', 'product:celular-x', 'home']);
    expect(plan.paths).toEqual(['/']);
  });

  it('traduce {entity, slug}', () => {
    expect(buildRevalidatePlan({ entity: 'product', slug: 'x' }).tags).toEqual(['products', 'product:x']);
  });

  describe('POST /api/revalidate', () => {
    beforeEach(() => {
      vi.resetModules();
      revalidateTag.mockReset();
      revalidatePath.mockReset();
    });

    async function load(secret: string) {
      vi.stubEnv('REVALIDATE_SECRET', secret);
      return import('@/app/api/revalidate/route');
    }

    it('401 con secreto incorrecto', async () => {
      const { POST } = await load('super-secreto');
      const res = await POST(new Request('http://x/api/revalidate', { method: 'POST', headers: { 'x-revalidate-secret': 'otro' }, body: '{"tags":["home"]}' }));
      expect(res.status).toBe(401);
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it('revalida cada tag con expiración inmediata', async () => {
      const { POST } = await load('super-secreto');
      const res = await POST(
        new Request('http://x/api/revalidate', { method: 'POST', headers: { 'x-revalidate-secret': 'super-secreto' }, body: '{"tags":["products","home"]}' }),
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ revalidated: true, tags: ['products', 'home'] });
      expect(revalidateTag).toHaveBeenCalledWith('products', { expire: 0 });
      expect(revalidateTag).toHaveBeenCalledWith('home', { expire: 0 });
    });

    it('400 sin tags', async () => {
      const { POST } = await load('super-secreto');
      const res = await POST(new Request('http://x/api/revalidate', { method: 'POST', headers: { 'x-revalidate-secret': 'super-secreto' }, body: '{}' }));
      expect(res.status).toBe(400);
    });

    it('503 si no hay secreto configurado', async () => {
      const { POST } = await load('');
      const res = await POST(new Request('http://x/api/revalidate', { method: 'POST', body: '{"tags":["home"]}' }));
      expect(res.status).toBe(503);
    });
  });
});
