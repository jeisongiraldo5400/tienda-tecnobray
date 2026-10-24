import { MAX_QTY_PER_ITEM } from '../../catalog/domain/stock-policy';

export interface PricingProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  stock: number;
  active: boolean;
  imageKey: string | null;
}

export interface RequestedItem {
  productId: string;
  quantity: number;
}

export interface PricedLine {
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  imageKey: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type LineProblem =
  | { productId: string; reason: 'unavailable'; name?: string }
  | { productId: string; reason: 'insufficient_stock'; name: string; maxQuantity: number }
  | { productId: string; reason: 'quantity_limit'; name: string; maxQuantity: number };

export interface PricingResult {
  lines: PricedLine[];
  problems: LineProblem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  itemsCount: number;
}

/** Une líneas repetidas del mismo producto sumando cantidades. */
export function mergeItems(items: RequestedItem[]): RequestedItem[] {
  const map = new Map<string, number>();
  for (const it of items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.quantity);
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Recalcula el pedido con los precios de la base de datos (nunca con los del cliente).
 * Los precios son finales (impuestos incluidos); el envío se coordina aparte (0 en el total).
 */
export function pricePlan(requested: RequestedItem[], products: PricingProduct[]): PricingResult {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: PricedLine[] = [];
  const problems: LineProblem[] = [];
  for (const item of mergeItems(requested)) {
    const p = byId.get(item.productId);
    if (!p || !p.active) {
      problems.push({ productId: item.productId, reason: 'unavailable', name: p?.name });
      continue;
    }
    if (item.quantity > MAX_QTY_PER_ITEM) {
      problems.push({ productId: p.id, reason: 'quantity_limit', name: p.name, maxQuantity: Math.min(MAX_QTY_PER_ITEM, p.stock) });
      continue;
    }
    if (p.stock < item.quantity) {
      problems.push({
        productId: p.id,
        reason: p.stock > 0 ? 'insufficient_stock' : 'unavailable',
        name: p.name,
        maxQuantity: Math.min(MAX_QTY_PER_ITEM, Math.max(0, p.stock)),
      } as LineProblem);
      continue;
    }
    lines.push({
      productId: p.id,
      productName: p.name,
      productSlug: p.slug,
      sku: p.sku,
      imageKey: p.imageKey,
      unitPrice: p.price,
      quantity: item.quantity,
      lineTotal: p.price * item.quantity,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shippingCost = 0;
  return {
    lines,
    problems,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    itemsCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const formatCop = (n: number): string => cop.format(n).replace(/\u00a0/g, ' ');

/** Sin pasarela de pago: el cliente confirma pago y envío por WhatsApp. */
export const WHATSAPP_ORDER_QUESTION =
  '¿Me confirman la disponibilidad, las formas de pago y el costo y tiempo de envío? ¡Gracias!';

/** Texto del mensaje de WhatsApp con el resumen del pedido. */
export function whatsappSummary(input: {
  storeName: string;
  number: string;
  customerName: string;
  city: string;
  address: string;
  lines: Array<{ productName: string; quantity: number; lineTotal: number }>;
  total: number;
}): string {
  const rows = input.lines.map((l) => `• ${l.quantity} x ${l.productName} — ${formatCop(l.lineTotal)}`);
  return [
    `¡Hola ${input.storeName}! Acabo de hacer el pedido *${input.number}*:`,
    ...rows,
    `*Total: ${formatCop(input.total)}*`,
    `A nombre de: ${input.customerName}`,
    `Envío a: ${input.address}, ${input.city}`,
    '',
    WHATSAPP_ORDER_QUESTION,
  ].join('\n');
}
