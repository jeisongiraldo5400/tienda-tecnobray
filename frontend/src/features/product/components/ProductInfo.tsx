import { ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { DiscountBadge } from '@/features/catalog/components/DiscountBadge';
import { PriceTag } from '@/features/catalog/components/PriceTag';
import { StockBadge } from '@/features/catalog/components/StockBadge';
import { discountPercent, formatCOP } from '@/shared/lib/format';
import type { Product } from '@/shared/types/domain';
import { PurchasePanel } from './PurchasePanel';

export function ProductInfo({ product, shippingText }: { product: Product; shippingText?: string }) {
  const savings = discountPercent(product.price, product.compareAtPrice) > 0 ? (product.compareAtPrice ?? 0) - product.price : 0;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {product.brand?.name ? (
          <Link href={`/productos?marca=${product.brand.slug}`} className="text-sm font-semibold uppercase tracking-wide text-brand hover:underline">
            {product.brand.name}
          </Link>
        ) : null}
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">{product.name}</h1>
        {product.sku ? <p className="text-xs text-slate-500">SKU: {product.sku}</p> : null}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
          <DiscountBadge price={product.price} compareAtPrice={product.compareAtPrice} className="text-sm" />
        </div>
        {savings > 0 ? <p className="text-sm font-semibold text-accent-text">Ahorras {formatCOP(savings)}</p> : null}
        <StockBadge stock={product.stock} lowThreshold={product.lowStockThreshold} />
      </div>
      {product.shortDescription ? <p className="text-slate-600">{product.shortDescription}</p> : null}
      <PurchasePanel product={product} />
      <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <li className="flex items-start gap-2">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" /> {shippingText ?? 'Envíos a toda Colombia'}
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" /> Garantía y pago contra entrega
        </li>
      </ul>
    </div>
  );
}
