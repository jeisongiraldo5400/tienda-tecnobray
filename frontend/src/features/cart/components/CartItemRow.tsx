'use client';

import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatCOP } from '@/shared/lib/format';
import { RemoteImage } from '@/shared/ui/RemoteImage';
import { MAX_QTY_PER_ITEM, useCartStore, type CartItem } from '../store/cart.store';
import { QuantityStepper } from './QuantityStepper';

export function CartItemRow({ item, onNavigate }: { item: CartItem; onNavigate?: () => void }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const max = Math.max(1, Math.min(item.stock, MAX_QTY_PER_ITEM));
  return (
    <li className="flex gap-3 py-4">
      <Link href={`/producto/${item.slug}`} onClick={onNavigate} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white sm:h-24 sm:w-24">
        <RemoteImage src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-contain p-1" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/producto/${item.slug}`} onClick={onNavigate} className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-brand">
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Quitar ${item.name} del carrito`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <QuantityStepper size="sm" value={item.quantity} max={max} onChange={(q) => setQuantity(item.productId, q)} />
          <div className="text-right">
            <p className="font-semibold text-slate-900 tabular-nums">{formatCOP(item.price * item.quantity)}</p>
            {item.quantity > 1 ? <p className="text-xs text-slate-500">{formatCOP(item.price)} c/u</p> : null}
          </div>
        </div>
      </div>
    </li>
  );
}
