import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { sha256 } from '../../../common/utils/hash';
import { normalizePhone, toWhatsappNumber } from '../../../common/utils/phone';
import { sortImages } from '../../catalog/application/catalog.mappers';
import { ProductEntity } from '../../catalog/infrastructure/persistence/product.entity';
import { SettingsService } from '../../settings/application/settings.service';
import { ORDER_STATUS_LABELS, OrderStatus } from '../domain/order-status';
import { pricePlan, whatsappSummary } from '../domain/pricing';
import { OrderEventEntity, OrderEventType } from '../infrastructure/persistence/order-event.entity';
import { OrderItemEntity } from '../infrastructure/persistence/order-item.entity';
import { OrderEntity } from '../infrastructure/persistence/order.entity';
import { OrderMapper } from './order-mapper';
import type { CheckoutDto } from './orders.dto';
import type { OrderConfirmationView } from './orders.views';

export const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{8,100}$/;

/**
 * Creación de pedidos desde la tienda.
 * - Recalcula precios en el servidor.
 * - Valida disponibilidad, pero NO descuenta stock (se descuenta al confirmar en el admin).
 * - Idempotency-Key obligatoria: un reintento con la misma llave y el mismo cuerpo devuelve
 *   el mismo pedido; con otro cuerpo responde 409.
 */
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    private readonly settings: SettingsService,
    private readonly mapper: OrderMapper,
  ) {}

  async placeOrder(dto: CheckoutDto, idempotencyKey: string | undefined): Promise<OrderConfirmationView> {
    if (!idempotencyKey || !IDEMPOTENCY_KEY_REGEX.test(idempotencyKey)) {
      throw new BadRequestException('Falta el encabezado Idempotency-Key (8 a 100 caracteres alfanuméricos, - o _).');
    }
    const requestHash = sha256(
      JSON.stringify({
        c: dto.customer,
        i: [...dto.items].sort((a, b) => a.productId.localeCompare(b.productId)),
      }),
    );

    const existing = await this.findByKey(idempotencyKey);
    if (existing) return this.replay(existing, requestHash);

    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.products.find({ where: { id: In(ids) }, relations: { images: true } });
    const plan = pricePlan(
      dto.items,
      products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        active: p.active,
        imageKey: sortImages(p.images)[0]?.thumbKey ?? null,
      })),
    );
    if (plan.problems.length) {
      throw new ConflictException({
        message: 'Algunos productos de tu carrito ya no están disponibles en la cantidad solicitada.',
        details: plan.problems,
      });
    }

    const c = dto.customer;
    try {
      const orderId = await this.dataSource.transaction(async (m) => {
        const [{ seq }] = await m.query(`SELECT nextval('order_number_seq')::int AS seq`);
        const order = m.create(OrderEntity, {
          number: `TB-${String(seq).padStart(6, '0')}`,
          status: OrderStatus.Nuevo,
          customerName: c.name,
          phone: c.phone,
          phoneNormalized: normalizePhone(c.phone),
          email: c.email ? c.email.toLowerCase() : null,
          city: c.city,
          address: c.address,
          notes: c.notes ?? null,
          subtotal: plan.subtotal,
          shippingCost: plan.shippingCost,
          total: plan.total,
          itemsCount: plan.itemsCount,
          stockApplied: false,
          idempotencyKey,
          requestHash,
        });
        const saved = await m.save(order);
        await m.save(plan.lines.map((l) => m.create(OrderItemEntity, { ...l, orderId: saved.id })));
        await m.save(
          m.create(OrderEventEntity, {
            orderId: saved.id,
            type: OrderEventType.Created,
            toStatus: OrderStatus.Nuevo,
            note: 'Pedido creado desde la tienda en línea',
          }),
        );
        return saved.id;
      });
      const order = await this.orders.findOneOrFail({ where: { id: orderId }, relations: { items: true } });
      this.logger.log(`Pedido ${order.number} creado (${order.itemsCount} unidades, total ${order.total})`);
      return this.confirmation(order, false);
    } catch (err) {
      // Carrera entre dos solicitudes con la misma llave: gana la primera.
      if (err instanceof QueryFailedError && (err as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505') {
        const winner = await this.findByKey(idempotencyKey);
        if (winner) return this.replay(winner, requestHash);
      }
      throw err;
    }
  }

  private async findByKey(key: string): Promise<OrderEntity | null> {
    return this.orders
      .createQueryBuilder('o')
      .addSelect('o.requestHash')
      .leftJoinAndSelect('o.items', 'items')
      .where('o.idempotency_key = :key', { key })
      .getOne();
  }

  private async replay(order: OrderEntity, requestHash: string): Promise<OrderConfirmationView> {
    if (order.requestHash && order.requestHash !== requestHash) {
      throw new ConflictException('La Idempotency-Key ya se usó con un pedido diferente.');
    }
    return this.confirmation(order, true);
  }

  async confirmation(order: OrderEntity, replayed: boolean): Promise<OrderConfirmationView> {
    const settings = await this.settings.getPublic();
    const items = (order.items ?? []).map((i) => this.mapper.item(i));
    const wa = toWhatsappNumber(settings.whatsapp);
    const text = whatsappSummary({
      storeName: settings.storeName,
      number: order.number,
      customerName: order.customerName,
      city: order.city,
      address: order.address,
      lines: order.items ?? [],
      total: order.total,
    });
    return {
      number: order.number,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status],
      createdAt: order.createdAt.toISOString(),
      customer: { name: order.customerName, phone: order.phone, email: order.email, city: order.city, address: order.address },
      notes: order.notes,
      items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      whatsappUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null,
      replayed,
    };
  }
}
