export enum OrderStatus {
  Nuevo = 'nuevo',
  Confirmado = 'confirmado',
  Enviado = 'enviado',
  Entregado = 'entregado',
  Cancelado = 'cancelado',
}

export const ORDER_STATUSES = Object.values(OrderStatus);

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Nuevo]: 'Nuevo',
  [OrderStatus.Confirmado]: 'Confirmado',
  [OrderStatus.Enviado]: 'Enviado',
  [OrderStatus.Entregado]: 'Entregado',
  [OrderStatus.Cancelado]: 'Cancelado',
};

/** Flujo: nuevo → confirmado → enviado → entregado; cancelado desde nuevo/confirmado/enviado. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Nuevo]: [OrderStatus.Confirmado, OrderStatus.Cancelado],
  [OrderStatus.Confirmado]: [OrderStatus.Enviado, OrderStatus.Cancelado],
  [OrderStatus.Enviado]: [OrderStatus.Entregado, OrderStatus.Cancelado],
  [OrderStatus.Entregado]: [],
  [OrderStatus.Cancelado]: [],
};

export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return allowedTransitions(from).includes(to);
}

/**
 * Política de inventario: el stock se descuenta al CONFIRMAR el pedido (no al crearlo)
 * y se repone al CANCELAR solo si ya se había descontado.
 */
export type StockEffect = 'decrement' | 'restore' | 'none';

export function stockEffect(to: OrderStatus, stockApplied: boolean): StockEffect {
  if (to === OrderStatus.Confirmado && !stockApplied) return 'decrement';
  if (to === OrderStatus.Cancelado && stockApplied) return 'restore';
  return 'none';
}
