import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { paginate, type Paginated } from '../../../common/pagination/pagination';
import type { AuthUser } from '../../../common/security/auth-user';
import { toWhatsappNumber } from '../../../common/utils/phone';
import { escapeLike } from '../../catalog/application/products.service';
import { ProductEntity } from '../../catalog/infrastructure/persistence/product.entity';
import { CacheTags, RevalidationService } from '../../revalidation/application/revalidation.service';
import { allowedTransitions, canTransition, ORDER_STATUS_LABELS, OrderStatus, stockEffect } from '../domain/order-status';
import { OrderEventEntity, OrderEventType } from '../infrastructure/persistence/order-event.entity';
import { OrderItemEntity } from '../infrastructure/persistence/order-item.entity';
import { OrderEntity } from '../infrastructure/persistence/order.entity';
import { OrderMapper } from './order-mapper';
import type { AdminOrdersQueryDto } from './orders.dto';
import type { AdminOrderDetail, AdminOrderListItem } from './orders.views';

const TZ = 'America/Bogota';

@Injectable()
export class OrdersAdminService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    private readonly mapper: OrderMapper,
    private readonly revalidation: RevalidationService,
  ) {}

  private listItem(o: OrderEntity): AdminOrderListItem {
    return {
      id: o.id,
      number: o.number,
      status: o.status,
      customerName: o.customerName,
      phone: o.phone,
      email: o.email,
      city: o.city,
      total: o.total,
      itemsCount: o.itemsCount,
      createdAt: o.createdAt.toISOString(),
    };
  }

  async list(q: AdminOrdersQueryDto): Promise<Paginated<AdminOrderListItem>> {
    const qb = this.orders.createQueryBuilder('o');
    if (q.status) qb.andWhere('o.status = :status', { status: q.status });
    if (q.q) {
      const term = `%${escapeLike(q.q.toLowerCase())}%`;
      const digits = q.q.replace(/\D/g, '');
      qb.andWhere(
        `(lower(o.number) LIKE :term OR lower(o.customer_name) LIKE :term OR lower(o.email) LIKE :term${
          digits.length >= 3 ? ' OR o.phone_normalized LIKE :digits' : ''
        })`,
        { term, digits: `%${digits}%` },
      );
    }
    if (q.dateFrom) qb.andWhere(`o.created_at >= (:from::date)::timestamp AT TIME ZONE '${TZ}'`, { from: q.dateFrom.slice(0, 10) });
    if (q.dateTo) {
      qb.andWhere(`o.created_at < ((:to::date + 1))::timestamp AT TIME ZONE '${TZ}'`, { to: q.dateTo.slice(0, 10) });
    }
    qb.orderBy('o.createdAt', 'DESC').offset((q.page - 1) * q.pageSize).limit(q.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return paginate(rows.map((o) => this.listItem(o)), total, q.page, q.pageSize);
  }

  async detail(id: string): Promise<AdminOrderDetail> {
    const o = await this.orders.findOne({ where: { id }, relations: { items: true, events: true } });
    if (!o) throw new NotFoundException('Pedido no encontrado.');
    const wa = toWhatsappNumber(o.phone);
    return {
      ...this.listItem(o),
      address: o.address,
      notes: o.notes,
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      stockApplied: o.stockApplied,
      items: (o.items ?? []).map((i) => this.mapper.item(i)),
      events: (o.events ?? [])
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((e) => ({
          id: e.id,
          type: e.type,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          note: e.note,
          userName: e.userName,
          createdAt: e.createdAt.toISOString(),
        })),
      allowedTransitions: allowedTransitions(o.status),
      whatsappUrl: wa ? `https://wa.me/${wa}` : null,
      updatedAt: o.updatedAt.toISOString(),
    };
  }

  /**
   * Cambia el estado en una transacción con bloqueo de fila del pedido.
   * Confirmar descuenta stock (bloqueando los productos en orden de id para evitar
   * interbloqueos); cancelar un pedido con stock descontado lo repone.
   */
  async changeStatus(id: string, to: OrderStatus, note: string | null | undefined, actor: AuthUser): Promise<AdminOrderDetail> {
    const touchedSlugs = await this.dataSource.transaction(async (m) => {
      const order = await m
        .getRepository(OrderEntity)
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id })
        .getOne();
      if (!order) throw new NotFoundException('Pedido no encontrado.');
      if (!canTransition(order.status, to)) {
        throw new BadRequestException(
          `No se puede pasar de "${ORDER_STATUS_LABELS[order.status]}" a "${ORDER_STATUS_LABELS[to]}".`,
        );
      }
      const items = await m.find(OrderItemEntity, { where: { orderId: id } });
      const effect = stockEffect(to, order.stockApplied);
      let slugs: string[] = [];
      if (effect !== 'none') slugs = await this.applyStock(m, items, effect);

      const from = order.status;
      await m.update(OrderEntity, { id }, {
        status: to,
        ...(effect === 'decrement' && { stockApplied: true }),
        ...(effect === 'restore' && { stockApplied: false }),
      });
      await m.save(
        m.create(OrderEventEntity, {
          orderId: id,
          type: OrderEventType.StatusChange,
          fromStatus: from,
          toStatus: to,
          note: note ?? null,
          userId: actor.id,
          userName: actor.name,
        }),
      );
      return slugs;
    });
    if (touchedSlugs.length) {
      this.revalidation.revalidate([CacheTags.products, CacheTags.home, ...touchedSlugs.map(CacheTags.product)]);
    }
    return this.detail(id);
  }

  async addNote(id: string, note: string, actor: AuthUser): Promise<AdminOrderDetail> {
    if (!(await this.orders.exists({ where: { id } }))) throw new NotFoundException('Pedido no encontrado.');
    await this.dataSource.getRepository(OrderEventEntity).save({
      orderId: id,
      type: OrderEventType.Note,
      note,
      userId: actor.id,
      userName: actor.name,
    });
    await this.orders.update(id, { updatedAt: new Date() });
    return this.detail(id);
  }

  private async applyStock(
    m: EntityManager,
    items: Array<{ productId: string | null; quantity: number; productName: string }>,
    effect: 'decrement' | 'restore',
  ): Promise<string[]> {
    const qty = new Map<string, number>();
    for (const it of items) if (it.productId) qty.set(it.productId, (qty.get(it.productId) ?? 0) + it.quantity);
    const ids = [...qty.keys()].sort();
    if (!ids.length) return [];
    const products = await m
      .getRepository(ProductEntity)
      .createQueryBuilder('p')
      .setLock('pessimistic_write')
      .where({ id: In(ids) })
      .orderBy('p.id', 'ASC')
      .getMany();
    if (effect === 'decrement') {
      const short = products.filter((p) => p.stock < (qty.get(p.id) ?? 0));
      if (short.length) {
        throw new ConflictException({
          message: `Stock insuficiente para confirmar: ${short.map((p) => `${p.name} (hay ${p.stock}, se piden ${qty.get(p.id)})`).join('; ')}.`,
          details: short.map((p) => ({ productId: p.id, name: p.name, stock: p.stock, requested: qty.get(p.id) })),
        });
      }
    }
    for (const p of products) {
      const delta = qty.get(p.id) ?? 0;
      await m
        .createQueryBuilder()
        .update(ProductEntity)
        .set({ stock: () => (effect === 'decrement' ? `stock - ${delta}` : `stock + ${delta}`) })
        .where('id = :id', { id: p.id })
        .execute();
    }
    return products.map((p) => p.slug);
  }
}
