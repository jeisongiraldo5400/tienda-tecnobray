'use client';

import { ShoppingBag } from 'lucide-react';
import { selectCount, useCartStore } from '../store/cart.store';
import { useHydrated } from '../hooks/useHydrated';

export function CartButton() {
  const count = useCartStore(selectCount);
  const open = useCartStore((s) => s.open);
  const hydrated = useHydrated();
  const shown = hydrated ? count : 0;
  return (
    <button
      type="button"
      onClick={open}
      className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-brand"
      aria-label={`Abrir carrito (${shown} ${shown === 1 ? 'producto' : 'productos'})`}
    >
      <ShoppingBag className="h-6 w-6" />
      {shown > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-on-accent">
          {shown > 99 ? '99+' : shown}
        </span>
      ) : null}
    </button>
  );
}
