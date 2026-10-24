'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useStoreSettings } from '@/features/settings/hooks/StoreSettingsProvider';
import { Button, buttonClasses } from '@/shared/ui/Button';
import { Card, CardBody } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/States';
import { useConfirm } from '@/shared/ui/ConfirmDialog';
import { useHydrated } from '../hooks/useHydrated';
import { useCartStore } from '../store/cart.store';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';

export function CartPageView() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const confirm = useConfirm();
  const settings = useStoreSettings();

  if (!hydrated) return <LoadingState label="Cargando carrito…" />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Tu carrito está vacío"
        description="Agrega productos para continuar con tu compra."
        action={
          <Link href="/productos" className={buttonClasses('primary', 'lg')}>
            Explorar productos
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <Card>
        <CardBody>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-sm text-slate-500">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (await confirm({ title: '¿Vaciar el carrito?', message: 'Se quitarán todos los productos.', confirmText: 'Vaciar' })) clear();
              }}
            >
              Vaciar carrito
            </Button>
          </div>
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card className="h-fit lg:sticky lg:top-32">
        <CardBody className="space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
          <CartSummary shippingText={settings.shippingText} />
          <Link href="/checkout" className={buttonClasses('accent', 'lg', 'w-full')}>
            Finalizar compra
          </Link>
          <Link href="/productos" className="flex min-h-11 items-center justify-center text-sm font-medium text-brand hover:underline">
            Seguir comprando
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
