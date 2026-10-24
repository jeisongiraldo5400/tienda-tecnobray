import type { CartItem } from '@/features/cart/store/cart.store';
import { formatCOP } from '@/shared/lib/format';
import type { Order } from '@/shared/types/domain';
import { normalizeColombianPhone, type CheckoutValues } from './checkout.schema';

export interface CreateOrderRequest {
  customer: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    address: string;
    notes?: string;
  };
  items: Array<{ productId: string; quantity: number }>;
}

/** Arma el cuerpo del pedido. Solo se envían ids y cantidades: el backend recalcula precios. */
export function toCreateOrderRequest(values: CheckoutValues, items: CartItem[]): CreateOrderRequest {
  const email = values.email.trim();
  const notes = values.notes.trim();
  return {
    customer: {
      name: values.name.trim(),
      phone: normalizeColombianPhone(values.phone),
      ...(email ? { email } : {}),
      city: values.city.trim(),
      address: values.address.trim(),
      ...(notes ? { notes } : {}),
    },
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  };
}

/** Huella del carrito + datos para reutilizar la misma Idempotency-Key en reintentos idénticos. */
export function orderFingerprint(request: CreateOrderRequest): string {
  return JSON.stringify(request);
}

export function buildOrderWhatsAppMessage(order: Order, storeName: string): string {
  const lines = [
    `¡Hola ${storeName}! Acabo de hacer el pedido *#${order.number}*.`,
    '',
    ...order.items.map((i) => `• ${i.quantity} × ${i.name} — ${formatCOP(i.subtotal)}`),
    '',
    `Subtotal: ${formatCOP(order.subtotal)}`,
  ];
  if (order.shippingCost > 0) lines.push(`Envío: ${formatCOP(order.shippingCost)}`);
  if (order.discount > 0) lines.push(`Descuento: -${formatCOP(order.discount)}`);
  lines.push(`*Total: ${formatCOP(order.total)}*`, '', `A nombre de: ${order.customer.name}`);
  if (order.customer.city || order.customer.address) {
    lines.push(`Entrega: ${[order.customer.address, order.customer.city].filter(Boolean).join(', ')}`);
  }
  lines.push('', '¿Me confirman la disponibilidad, las formas de pago y el costo y tiempo de envío? ¡Gracias!');
  return lines.join('\n');
}
