'use client';

import { CartSummary } from '@/features/cart/components/CartSummary';
import type { CartItem } from '@/features/cart/store/cart.store';
import { formatCOP } from '@/shared/lib/format';
import { RemoteImage } from '@/shared/ui/RemoteImage';

export function OrderReview({ items, shippingText }: { items: CartItem[]; shippingText?: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Tu pedido</h2>
      <ul className="divide-y divide-slate-100">
        {items.map((i) => (
          <li key={i.productId} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white">
              <RemoteImage src={i.imageUrl} alt={i.name} fill sizes="56px" className="object-contain p-1" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-on-brand">
                {i.quantity}
              </span>
            </div>
            <p className="line-clamp-2 flex-1 text-sm text-slate-700">{i.name}</p>
            <p className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">{formatCOP(i.price * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <CartSummary shippingText={shippingText} />
    </div>
  );
}
