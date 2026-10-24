import Link from 'next/link';
import { AddToCartButton } from '@/features/cart/components/AddToCartButton';
import type { ProductSummary } from '@/shared/types/domain';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { DiscountBadge } from './DiscountBadge';
import { PriceTag } from './PriceTag';

export function ProductCard({ product, priority = false, eager = false }: { product: ProductSummary; priority?: boolean; eager?: boolean }) {
  const soldOut = product.stock <= 0;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-[box-shadow,border-color] hover:border-slate-300 hover:shadow-lg">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden border-b border-slate-100 bg-white">
        <RemoteImage
          src={product.image?.url}
          alt={product.image?.alt || product.name}
          fill
          preload={priority}
          loading={!priority && eager ? 'eager' : undefined}
          sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 300px"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105 sm:p-3"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <DiscountBadge price={product.price} compareAtPrice={product.compareAtPrice} />
          {soldOut ? <span className="rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">Agotado</span> : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
        {product.brand?.name ? (
          <p className="truncate text-[11px] font-semibold tracking-wide text-slate-500 uppercase sm:text-xs">{product.brand.name}</p>
        ) : null}
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium text-slate-900 sm:min-h-12 sm:text-base sm:leading-6">
          <Link href={`/producto/${product.slug}`} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>
        <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="mt-auto pt-1" />
        <AddToCartButton product={product} size="md" className="mt-1 w-full" openDrawer={false} shortLabelOnMobile />
      </div>
    </article>
  );
}
