/** Tope de unidades por producto en un pedido web. */
export const MAX_QTY_PER_ITEM = 10;

export interface PublicStock {
  inStock: boolean;
  /** Máximo que el cliente puede pedir: min(stock, tope). Nunca expone el stock real por encima del tope. */
  maxQuantity: number;
}

export function publicStock(stock: number, active = true): PublicStock {
  const available = active ? Math.max(0, Math.floor(stock)) : 0;
  return { inStock: available > 0, maxQuantity: Math.min(available, MAX_QTY_PER_ITEM) };
}
