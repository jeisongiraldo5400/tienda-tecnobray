'use client';

import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { productToCartInput } from '@/features/cart/adapters/cart.adapter';
import { QuantityStepper } from '@/features/cart/components/QuantityStepper';
import { MAX_QTY_PER_ITEM, useCartStore } from '@/features/cart/store/cart.store';
import { useStoreSettings } from '@/features/settings/hooks/StoreSettingsProvider';
import { formatCOP } from '@/shared/lib/format';
import { buildWhatsAppUrl } from '@/shared/lib/whatsapp';
import { publicEnv } from '@/shared/config/env.public';
import type { ProductSummary } from '@/shared/types/domain';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { WhatsAppIcon } from '@/shared/ui/WhatsAppIcon';

export function buildProductWhatsAppMessage(product: ProductSummary, quantity: number, siteUrl: string): string {
  return [
    `¡Hola! Quiero comprar este producto:`,
    `• ${product.name}${product.sku ? ` (SKU ${product.sku})` : ''}`,
    `• Cantidad: ${quantity}`,
    `• Precio: ${formatCOP(product.price)} c/u`,
    `${siteUrl}/producto/${product.slug}`,
  ].join('\n');
}

export function PurchasePanel({ product }: { product: ProductSummary }) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const open = useCartStore((s) => s.open);
  const router = useRouter();
  const settings = useStoreSettings();
  const soldOut = product.stock <= 0;
  const max = Math.max(1, Math.min(product.stock, MAX_QTY_PER_ITEM));

  function add() {
    addItem(productToCartInput(product), qty);
    toast.success('Producto agregado al carrito', { description: `${qty} × ${product.name}` });
    open();
  }

  function buyNow() {
    addItem(productToCartInput(product), qty);
    router.push('/checkout');
  }

  // Barra fija inferior (solo móvil): aparece cuando los botones de compra quedaron arriba, fuera de la vista.
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || soldOut || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry) setShowBar(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [soldOut]);
  useEffect(() => {
    const root = document.documentElement;
    if (showBar) root.dataset.stickyCta = '1';
    else delete root.dataset.stickyCta;
    return () => {
      delete root.dataset.stickyCta;
    };
  }, [showBar]);

  const waUrl = buildWhatsAppUrl(settings.contact.whatsapp, buildProductWhatsAppMessage(product, qty, publicEnv.siteUrl));

  return (
    <div className="space-y-4">
      {!soldOut ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Cantidad</span>
          <QuantityStepper value={qty} max={max} onChange={(v) => setQty(Math.min(Math.max(1, v), max))} />
        </div>
      ) : null}
      <div ref={actionsRef} className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" variant="accent" className="sm:order-last" onClick={buyNow} disabled={soldOut}>
          <Zap className="h-4 w-4" aria-hidden="true" /> Comprar ahora
        </Button>
        <Button size="lg" onClick={add} disabled={soldOut}>
          {soldOut ? 'Agotado' : 'Agregar al carrito'}
        </Button>
      </div>
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses('whatsapp', 'lg', 'w-full text-base')}>
        <WhatsAppIcon className="h-6 w-6" />
        {soldOut ? 'Consultar disponibilidad por WhatsApp' : 'Comprar por WhatsApp'}
      </a>
      {showBar ? (
        <div className="no-print pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 shadow-[0_-4px_16px_rgba(11,30,63,0.08)] backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-slate-500">{product.name}</p>
              <p className="text-lg leading-6 font-bold text-slate-900">{formatCOP(product.price)}</p>
            </div>
            {/* Nombre accesible distinto del botón principal para no duplicarlo. */}
            <Button size="lg" variant="accent" onClick={add} aria-label={`Añadir ${qty} × ${product.name} al carrito`}>
              Agregar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
