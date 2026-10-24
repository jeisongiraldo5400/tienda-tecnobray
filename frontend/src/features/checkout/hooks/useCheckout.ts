'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ApiError } from '@/shared/api/errors';
import { applyStockConflicts, parseStockConflicts } from '../adapters/stock-conflicts';
import { useCartStore } from '@/features/cart/store/cart.store';
import { createIdempotencyKey } from '@/shared/lib/idempotency';
import type { Order } from '@/shared/types/domain';
import type { CheckoutValues } from '../adapters/checkout.schema';
import { orderFingerprint, toCreateOrderRequest } from '../adapters/order-request';
import { createOrder } from '../services/checkout.service';
import { saveLastOrder } from '../store/last-order';

/**
 * Envía el pedido con Idempotency-Key. La clave se reutiliza mientras el contenido
 * del pedido sea idéntico (reintentos por red o doble clic) y cambia si el pedido cambia.
 */
export function useCheckout() {
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);
  const keyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const [cartNotices, setCartNotices] = useState<string[]>([]);

  const mutation = useMutation<Order, Error, CheckoutValues>({
    mutationFn: async (values) => {
      setCartNotices([]);
      const items = useCartStore.getState().items;
      const request = toCreateOrderRequest(values, items);
      const fingerprint = orderFingerprint(request);
      if (!keyRef.current || keyRef.current.fingerprint !== fingerprint) {
        keyRef.current = { fingerprint, key: createIdempotencyKey() };
      }
      return createOrder(request, keyRef.current.key);
    },
    onSuccess: (order) => {
      keyRef.current = null;
      saveLastOrder(order);
      clear();
      router.push(`/pedido/confirmacion?numero=${encodeURIComponent(order.number)}`);
    },
    onError: (error) => {
      // 409 por stock: ajustar el carrito con lo disponible para que el cliente reintente.
      if (error instanceof ApiError && error.status === 409) {
        const conflicts = parseStockConflicts(error.rawDetails);
        if (conflicts.length > 0) {
          const { items, messages } = applyStockConflicts(useCartStore.getState().items, conflicts);
          useCartStore.getState().replaceItems(items);
          setCartNotices(messages);
        }
      }
    },
  });

  return Object.assign(mutation, { cartNotices });
}
