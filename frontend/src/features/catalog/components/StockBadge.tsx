import { Badge } from '@/shared/ui/Badge';
import { stockState } from '../adapters/catalog.adapter';

export function StockBadge({ stock, lowThreshold }: { stock: number; lowThreshold?: number }) {
  const state = stockState(stock, lowThreshold);
  if (state === 'out_of_stock') return <Badge tone="danger">Agotado</Badge>;
  if (state === 'low_stock') return <Badge tone="warning">¡Últimas {stock} unidades!</Badge>;
  return <Badge tone="success">Disponible</Badge>;
}
