import type { CartProductInput } from '@/features/cart/store/cart.store';

/** Respuestas de ejemplo con la forma documentada en backend/API.md. */
export const productCardDto = {
  id: '381bf97f-5122-4fcd-9ead-8986bb497425',
  slug: 'sonik-buds-pro',
  name: 'Sonik Buds Pro',
  shortDescription: 'Earbuds con ANC',
  price: 459900,
  compareAtPrice: 529900,
  featured: true,
  inStock: true,
  maxQuantity: 10,
  brand: { name: 'Sonik', slug: 'sonik' },
  category: { name: 'Audífonos', slug: 'audifonos' },
  image: { url: 'http://localhost:4001/api/media/a/1600.webp', thumbUrl: 'http://localhost:4001/api/media/a/400.webp', alt: 'Sonik', width: 1600, height: 1600 },
};

export const cartProduct = (over: Partial<CartProductInput> = {}): CartProductInput => ({
  productId: 'p1',
  slug: 'celular-x',
  name: 'Celular X',
  price: 1_000_000,
  compareAtPrice: 1_200_000,
  imageUrl: 'http://localhost:4001/img.webp',
  stock: 10,
  ...over,
});

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}
