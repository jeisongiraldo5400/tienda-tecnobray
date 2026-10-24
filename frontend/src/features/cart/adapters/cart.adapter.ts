import type { ProductSummary } from '@/shared/types/domain';
import type { CartProductInput } from '../store/cart.store';

export function productToCartInput(p: ProductSummary): CartProductInput {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    imageUrl: p.image?.thumbUrl ?? p.image?.url,
    stock: p.stock,
  };
}
