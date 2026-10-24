import type { ProductSummary } from '@/shared/types/domain';
import { ProductCard } from './ProductCard';

/**
 * `priorityCount` tarjetas se precargan (candidatas a LCP). Las dos primeras filas en cualquier ancho
 * (hasta 4 columnas) se cargan sin lazy-loading: en tablet (3 columnas) la 5.ª tarjeta ya está sobre el pliegue.
 */
export function ProductGrid({ products, priorityCount = 0, eagerCount = 8 }: { products: ProductSummary[]; priorityCount?: number; eagerCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id || p.slug}>
          <ProductCard product={p} priority={i < priorityCount} eager={i < Math.max(eagerCount, priorityCount)} />
        </li>
      ))}
    </ul>
  );
}
