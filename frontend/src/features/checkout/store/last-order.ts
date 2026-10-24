import type { Order } from '@/shared/types/domain';

const KEY = 'tecnobray-last-order';

/** Guarda el último pedido en sessionStorage para la página de confirmación. */
export function saveLastOrder(order: Order): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function readLastOrder(number: string): Order | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const order = JSON.parse(raw) as Order;
    return order.number === number ? order : null;
  } catch {
    return null;
  }
}
