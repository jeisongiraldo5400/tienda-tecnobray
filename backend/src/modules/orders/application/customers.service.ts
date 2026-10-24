import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, type Paginated } from '../../../common/pagination/pagination';
import { escapeLike } from '../../catalog/application/products.service';
import { OrderEntity } from '../infrastructure/persistence/order.entity';
import type { CustomersQueryDto } from './orders.dto';
import type { CustomerView } from './orders.views';

/** Clientes derivados de los pedidos, agrupados por teléfono normalizado. */
@Injectable()
export class CustomersService {
  constructor(@InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>) {}

  async list(q: CustomersQueryDto): Promise<Paginated<CustomerView>> {
    const params: unknown[] = [];
    let where = '';
    if (q.q) {
      params.push(`%${escapeLike(q.q.toLowerCase())}%`);
      const digits = q.q.replace(/\D/g, '');
      where = `WHERE lower(customer_name) LIKE $1 OR lower(email) LIKE $1`;
      if (digits.length >= 3) {
        params.push(`%${digits}%`);
        where += ` OR phone_normalized LIKE $2`;
      }
    }
    const grouped = `
      SELECT phone_normalized,
             (array_agg(phone ORDER BY created_at DESC))[1] AS phone,
             (array_agg(customer_name ORDER BY created_at DESC))[1] AS name,
             (array_agg(email ORDER BY created_at DESC) FILTER (WHERE email IS NOT NULL))[1] AS email,
             (array_agg(city ORDER BY created_at DESC))[1] AS city,
             COUNT(*)::int AS orders_count,
             COALESCE(SUM(total) FILTER (WHERE status <> 'cancelado'), 0)::bigint AS total_spent,
             MIN(created_at) AS first_order_at,
             MAX(created_at) AS last_order_at
      FROM orders ${where}
      GROUP BY phone_normalized`;
    const [{ count }] = await this.orders.query(`SELECT COUNT(*)::int AS count FROM (${grouped}) g`, params);
    const rows: Array<Record<string, unknown>> = await this.orders.query(
      `${grouped} ORDER BY last_order_at DESC LIMIT ${q.pageSize} OFFSET ${(q.page - 1) * q.pageSize}`,
      params,
    );
    return paginate(
      rows.map((r) => ({
        phone: String(r.phone),
        name: String(r.name),
        email: (r.email as string | null) ?? null,
        city: String(r.city),
        ordersCount: Number(r.orders_count),
        totalSpent: Number(r.total_spent),
        firstOrderAt: new Date(r.first_order_at as string).toISOString(),
        lastOrderAt: new Date(r.last_order_at as string).toISOString(),
      })),
      Number(count),
      q.page,
      q.pageSize,
    );
  }
}
