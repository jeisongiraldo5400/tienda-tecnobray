'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useStoreSettings } from '@/features/settings/hooks/StoreSettingsProvider';
import { buttonClasses } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { EmptyState } from '@/shared/ui/States';
import { useHydrated } from '../hooks/useHydrated';
import { useCartStore } from '../store/cart.store';
import { CartItemRow } from './CartItemRow';
import { CartSummary } from './CartSummary';

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const hydrated = useHydrated();
  const pathname = usePathname();
  const settings = useStoreSettings();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <Drawer
      open={hydrated && isOpen}
      onClose={close}
      title="Tu carrito"
      footer={
        items.length > 0 ? (
          <div className="space-y-4">
            <CartSummary shippingText={settings.shippingText} />
            <div className="grid gap-2">
              <Link href="/checkout" onClick={close} className={buttonClasses('accent', 'lg', 'w-full')}>
                Finalizar compra
              </Link>
              <Link href="/carrito" onClick={close} className={buttonClasses('outline', 'lg', 'w-full md:h-10 md:text-sm')}>
                Ver carrito
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Tu carrito está vacío"
            description="Explora nuestro catálogo y encuentra lo que necesitas."
            action={
              <Link href="/productos" onClick={close} className={buttonClasses('primary')}>
                Ver productos
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 px-4 sm:px-5">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} onNavigate={close} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
