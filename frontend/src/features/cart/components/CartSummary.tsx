'use client';

import { formatCOP } from '@/shared/lib/format';
import { selectSavings, selectSubtotal, useCartStore } from '../store/cart.store';

export function CartSummary({ shippingText }: { shippingText?: string }) {
  const subtotal = useCartStore(selectSubtotal);
  const savings = useCartStore(selectSavings);
  return (
    <div className="space-y-2">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Subtotal</dt>
          <dd className="font-semibold text-slate-900">{formatCOP(subtotal)}</dd>
        </div>
        {savings > 0 ? (
          <div className="flex justify-between text-accent-text">
            <dt>Ahorras</dt>
            <dd className="font-semibold">{formatCOP(savings)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="shrink-0 text-slate-600">Envío</dt>
          <dd className="line-clamp-2 text-right text-slate-600">{shippingText ?? 'Se calcula al confirmar'}</dd>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
          <dt className="font-semibold text-slate-900">Total estimado</dt>
          <dd className="font-bold text-slate-900">{formatCOP(subtotal)}</dd>
        </div>
      </dl>
      <p className="text-xs text-slate-500">El total final se confirma al crear el pedido con los precios vigentes.</p>
    </div>
  );
}
