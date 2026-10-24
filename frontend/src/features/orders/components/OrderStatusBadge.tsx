import type { OrderStatus } from '@/shared/types/domain';
import { Badge, type BadgeTone } from '@/shared/ui/Badge';
import { ORDER_STATUS_LABELS } from '../adapters/order.adapter';

const TONES: Record<OrderStatus, BadgeTone> = {
  nuevo: 'warning',
  confirmado: 'info',
  enviado: 'brand',
  entregado: 'success',
  cancelado: 'danger',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
