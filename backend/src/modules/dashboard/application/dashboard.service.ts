import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MediaUrlService } from '../../storage/application/media-url.service';
import type { OrderStatus } from '../../orders/domain/order-status';

export interface DashboardView {
  ordersToday: number;
  ordersWeek: number;
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  salesTotal: number;
  pendingOrders: number;
  ordersByStatus: Record<string, number>;
  lowStockThreshold: number;
  lowStockCount: number;
  lowStock: Array<{ id: string; name: string; sku: string; stock: number; thumbUrl: string | null }>;
  latestOrders: Array<{ id: string; number: string; customerName: string; total: number; status: OrderStatus; createdAt: string }>;
}

const TZ = `'America/Bogota'`;
const start = (unit: 'day' | 'week' | 'month') => `(date_trunc('${unit}', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`;

/** Métricas del panel. "Hoy", "semana" (lunes a domingo) y "mes" en hora de Colombia. Ventas excluyen cancelados. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly ds: DataSource,
    private readonly media: MediaUrlService,
  ) {}

  async get(): Promise<DashboardView> {
    const [[m], byStatus, [settings], latest] = await Promise.all([
      this.ds.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= ${start('day')})::int AS orders_today,
          COUNT(*) FILTER (WHERE created_at >= ${start('week')})::int AS orders_week,
          COALESCE(SUM(total) FILTER (WHERE status <> 'cancelado' AND created_at >= ${start('day')}), 0)::bigint AS sales_today,
          COALESCE(SUM(total) FILTER (WHERE status <> 'cancelado' AND created_at >= ${start('week')}), 0)::bigint AS sales_week,
          COALESCE(SUM(total) FILTER (WHERE status <> 'cancelado' AND created_at >= ${start('month')}), 0)::bigint AS sales_month,
          COALESCE(SUM(total) FILTER (WHERE status <> 'cancelado'), 0)::bigint AS sales_total,
          COUNT(*) FILTER (WHERE status = 'nuevo')::int AS pending
        FROM orders`),
      this.ds.query(`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`),
      this.ds.query(`SELECT low_stock_threshold FROM store_settings WHERE id = 1`),
      this.ds.query(
        `SELECT id, number, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10`,
      ),
    ]);
    const threshold = Number(settings?.low_stock_threshold ?? 5);
    const [[{ count: lowCount }], low] = await Promise.all([
      this.ds.query(`SELECT COUNT(*)::int AS count FROM products WHERE active = true AND stock <= $1`, [threshold]),
      this.ds.query(
        `SELECT p.id, p.name, p.sku, p.stock,
                (SELECT i.thumb_key FROM product_images i WHERE i.product_id = p.id ORDER BY i.is_main DESC, i.sort_order ASC LIMIT 1) AS thumb_key
         FROM products p WHERE p.active = true AND p.stock <= $1 ORDER BY p.stock ASC, p.name ASC LIMIT 10`,
        [threshold],
      ),
    ]);
    return {
      ordersToday: m.orders_today,
      ordersWeek: m.orders_week,
      salesToday: Number(m.sales_today),
      salesWeek: Number(m.sales_week),
      salesMonth: Number(m.sales_month),
      salesTotal: Number(m.sales_total),
      pendingOrders: m.pending,
      ordersByStatus: Object.fromEntries(byStatus.map((r: { status: string; count: number }) => [r.status, r.count])),
      lowStockThreshold: threshold,
      lowStockCount: lowCount,
      lowStock: low.map((r: { id: string; name: string; sku: string; stock: number; thumb_key: string | null }) => ({
        id: r.id,
        name: r.name,
        sku: r.sku,
        stock: r.stock,
        thumbUrl: this.media.url(r.thumb_key),
      })),
      latestOrders: latest.map(
        (r: { id: string; number: string; customer_name: string; total: number; status: OrderStatus; created_at: Date }) => ({
          id: r.id,
          number: r.number,
          customerName: r.customer_name,
          total: r.total,
          status: r.status,
          createdAt: new Date(r.created_at).toISOString(),
        }),
      ),
    };
  }
}
