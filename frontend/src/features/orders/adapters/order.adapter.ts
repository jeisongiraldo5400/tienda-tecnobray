import { arr, asRecord, num, optStr, str } from '@/shared/api/normalize';
import { ORDER_STATUSES, type Order, type OrderHistoryEntry, type OrderItem, type OrderStatus } from '@/shared/types/domain';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: 'Nuevo',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

const ALIASES: Record<string, OrderStatus> = {
  pending: 'nuevo',
  new: 'nuevo',
  confirmed: 'confirmado',
  shipped: 'enviado',
  sent: 'enviado',
  delivered: 'entregado',
  cancelled: 'cancelado',
  canceled: 'cancelado',
};

/** Transiciones permitidas (espejo de la regla del backend; el backend valida). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  nuevo: ['confirmado', 'cancelado'],
  confirmado: ['enviado', 'cancelado'],
  enviado: ['entregado', 'cancelado'],
  entregado: [],
  cancelado: [],
};

export function toOrderStatus(value: unknown): OrderStatus {
  const s = str(value).toLowerCase().trim();
  if ((ORDER_STATUSES as readonly string[]).includes(s)) return s as OrderStatus;
  return ALIASES[s] ?? 'nuevo';
}

function toItem(raw: unknown): OrderItem {
  const r = asRecord(raw);
  const product = asRecord(r.product);
  const unitPrice = num(r.unitPrice ?? r.price ?? r.unit_price);
  const quantity = num(r.quantity ?? r.qty, 1);
  return {
    productId: str(r.productId ?? product.id),
    name: str(r.productName ?? r.name ?? product.name),
    slug: optStr(r.productSlug ?? product.slug),
    sku: optStr(r.sku ?? product.sku),
    imageUrl: optStr(r.imageUrl ?? r.image ?? asRecord(product.mainImage).url),
    unitPrice,
    quantity,
    subtotal: num(r.subtotal ?? r.total ?? r.lineTotal, unitPrice * quantity),
  };
}

function toHistory(raw: unknown): OrderHistoryEntry {
  const r = asRecord(raw);
  const by = asRecord(r.user ?? r.changedBy);
  return {
    status: toOrderStatus(r.status ?? r.toStatus),
    note: optStr(r.note ?? r.notes ?? r.comment),
    createdAt: str(r.at ?? r.createdAt ?? r.date),
    by: optStr(by.name ?? r.userName ?? r.byName),
  };
}

export function toOrder(raw: unknown): Order {
  const r = asRecord(raw);
  const c = asRecord(r.customer);
  const shipping = asRecord(r.shipping ?? r.shippingAddress);
  const items = arr(r.items ?? r.lines).map(toItem);
  const subtotal = num(r.subtotal, items.reduce((acc, i) => acc + i.subtotal, 0));
  const shippingCost = num(r.shippingCost ?? r.shippingTotal ?? r.shipping_cost, 0);
  const discount = num(r.discount ?? r.discountTotal, 0);
  return {
    id: str(r.id),
    number: str(r.number ?? r.orderNumber ?? r.code ?? r.id),
    status: toOrderStatus(r.status),
    statusLabel: optStr(r.statusLabel),
    whatsappUrl: optStr(r.whatsappUrl),
    customer: {
      name: str(c.name ?? r.customerName),
      phone: str(c.phone ?? r.customerPhone ?? r.phone),
      email: optStr(c.email ?? r.customerEmail ?? r.email),
      city: str(shipping.city ?? c.city ?? r.city),
      address: str(shipping.address ?? c.address ?? r.address),
      notes: optStr(r.notes ?? c.notes ?? shipping.notes) ?? undefined,
    },
    items,
    subtotal,
    shippingCost,
    discount,
    total: num(r.total ?? r.grandTotal, subtotal + shippingCost - discount),
    createdAt: str(r.createdAt),
    updatedAt: optStr(r.updatedAt),
    history: arr(r.timeline ?? r.history ?? r.statusHistory).map(toHistory),
  };
}

/** Pasos visibles para el cliente (cancelado se muestra aparte). */
export const TRACKING_STEPS: OrderStatus[] = ['nuevo', 'confirmado', 'enviado', 'entregado'];
