import { arr, asRecord, num, optStr, str } from '@/shared/api/normalize';
import { ORDER_STATUSES, type OrderStatus } from '@/shared/types/domain';
import { toOrderStatus } from '@/features/orders/adapters/order.adapter';

export interface DashboardData {
  ordersToday: number;
  ordersWeek: number;
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  salesTotal: number;
  pendingOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  lowStockThreshold: number;
  lowStockCount: number;
  lowStock: Array<{ id: string; name: string; sku: string; stock: number; thumbUrl?: string }>;
  latestOrders: Array<{ id: string; number: string; customerName: string; total: number; status: OrderStatus; createdAt: string }>;
}

export function toDashboard(raw: unknown): DashboardData {
  const r = asRecord(raw);
  const byStatus = asRecord(r.ordersByStatus);
  return {
    ordersToday: num(r.ordersToday),
    ordersWeek: num(r.ordersWeek),
    salesToday: num(r.salesToday),
    salesWeek: num(r.salesWeek),
    salesMonth: num(r.salesMonth),
    salesTotal: num(r.salesTotal),
    pendingOrders: num(r.pendingOrders),
    ordersByStatus: Object.fromEntries(ORDER_STATUSES.map((s) => [s, num(byStatus[s])])) as Record<OrderStatus, number>,
    lowStockThreshold: num(r.lowStockThreshold, 5),
    lowStockCount: num(r.lowStockCount, arr(r.lowStock).length),
    lowStock: arr(r.lowStock).map((p) => {
      const pr = asRecord(p);
      return { id: str(pr.id), name: str(pr.name), sku: str(pr.sku), stock: num(pr.stock), thumbUrl: optStr(pr.thumbUrl) };
    }),
    latestOrders: arr(r.latestOrders).map((o) => {
      const or = asRecord(o);
      return {
        id: str(or.id),
        number: str(or.number),
        customerName: str(or.customerName),
        total: num(or.total),
        status: toOrderStatus(or.status),
        createdAt: str(or.createdAt),
      };
    }),
  };
}
