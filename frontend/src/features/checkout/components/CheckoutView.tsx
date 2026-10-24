'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useHydrated } from '@/features/cart/hooks/useHydrated';
import { selectSubtotal, useCartStore } from '@/features/cart/store/cart.store';
import { useStoreSettings } from '@/features/settings/hooks/StoreSettingsProvider';
import { buttonClasses } from '@/shared/ui/Button';
import { Card, CardBody } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/States';
import { useCheckout } from '../hooks/useCheckout';
import { CheckoutForm } from './CheckoutForm';
import { OrderReview } from './OrderReview';

export function CheckoutView() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectSubtotal);
  const settings = useStoreSettings();
  const checkout = useCheckout();

  if (!hydrated) return <LoadingState label="Cargando tu pedido…" />;

  if (items.length === 0 && !checkout.isSuccess) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="No hay productos para pagar"
        description="Agrega productos a tu carrito para finalizar la compra."
        action={
          <Link href="/productos" className={buttonClasses('primary', 'lg')}>
            Ver productos
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
      <Card>
        <CardBody className="space-y-5 p-5 sm:p-7">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Datos de envío</h2>
            <p className="mt-1 text-sm text-slate-500">Completa tus datos y te confirmamos el pedido por WhatsApp.</p>
          </div>
          {checkout.cartNotices.length > 0 ? (
            <ul role="alert" className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {checkout.cartNotices.map((m) => (
                <li key={m}>{m}</li>
              ))}
              <li className="font-medium">Revisa tu pedido y confirma de nuevo.</li>
            </ul>
          ) : null}
          <CheckoutForm
            onSubmit={(values) => checkout.mutateAsync(values)}
            submitting={checkout.isPending || checkout.isSuccess}
            error={checkout.error}
            disabled={items.length === 0}
            total={subtotal}
          />
        </CardBody>
      </Card>
      <Card className="h-fit lg:sticky lg:top-32">
        <CardBody>
          <OrderReview items={items} shippingText={settings.shippingText} />
        </CardBody>
      </Card>
    </div>
  );
}
