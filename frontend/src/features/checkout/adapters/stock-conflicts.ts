import type { CartItem } from '@/features/cart/store/cart.store';
import { asRecord, num, optStr, str } from '@/shared/api/normalize';

export interface StockConflict {
  productId: string;
  reason: 'unavailable' | 'insufficient_stock' | 'quantity_limit' | string;
  name?: string;
  maxQuantity?: number;
}

export function parseStockConflicts(details: unknown): StockConflict[] {
  if (!Array.isArray(details)) return [];
  return details
    .map((d): StockConflict | null => {
      const r = asRecord(d);
      const productId = str(r.productId);
      if (!productId) return null;
      return {
        productId,
        reason: str(r.reason, 'unavailable'),
        name: optStr(r.name),
        maxQuantity: r.maxQuantity === undefined ? undefined : num(r.maxQuantity, 0),
      };
    })
    .filter((c): c is StockConflict => c !== null);
}

/**
 * Ajusta el carrito según los conflictos del 409 del checkout:
 * quita productos no disponibles y reduce cantidades a `maxQuantity`.
 */
export function applyStockConflicts(items: CartItem[], conflicts: StockConflict[]): { items: CartItem[]; messages: string[] } {
  const messages: string[] = [];
  const next: CartItem[] = [];
  for (const item of items) {
    const conflict = conflicts.find((c) => c.productId === item.productId);
    if (!conflict) {
      next.push(item);
      continue;
    }
    const name = conflict.name ?? item.name;
    const max = conflict.maxQuantity ?? 0;
    if (conflict.reason === 'unavailable' || max <= 0) {
      messages.push(`“${name}” ya no está disponible y se quitó del carrito.`);
      continue;
    }
    if (item.quantity > max) {
      messages.push(`“${name}”: solo hay ${max} ${max === 1 ? 'unidad disponible' : 'unidades disponibles'}; ajustamos la cantidad.`);
      next.push({ ...item, quantity: max, stock: max });
    } else {
      next.push({ ...item, stock: max });
    }
  }
  return { items: next, messages };
}
