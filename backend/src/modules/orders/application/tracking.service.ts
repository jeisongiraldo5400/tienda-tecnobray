import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizePhone } from '../../../common/utils/phone';
import { ORDER_STATUS_LABELS } from '../domain/order-status';
import { OrderEventType } from '../infrastructure/persistence/order-event.entity';
import { OrderEntity } from '../infrastructure/persistence/order.entity';
import { OrderMapper } from './order-mapper';
import type { TrackingView } from './orders.views';

const NOT_FOUND = 'No encontramos un pedido con ese número y teléfono.';

/** Seguimiento público: requiere número + teléfono; nunca expone notas internas. */
@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    private readonly mapper: OrderMapper,
  ) {}

  async track(numberRaw: string, phone: string): Promise<TrackingView> {
    const digits = numberRaw.replace(/\D/g, '');
    const number = `TB-${digits.padStart(6, '0')}`;
    const order = await this.orders.findOne({ where: { number }, relations: { items: true, events: true } });
    if (!order || order.phoneNormalized !== normalizePhone(phone)) throw new NotFoundException(NOT_FOUND);
    const timeline = (order.events ?? [])
      .filter((e) => e.type !== OrderEventType.Note && e.toStatus)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({ status: e.toStatus!, label: ORDER_STATUS_LABELS[e.toStatus!], at: e.createdAt.toISOString() }));
    return {
      number: order.number,
      status: order.status,
      statusLabel: ORDER_STATUS_LABELS[order.status],
      createdAt: order.createdAt.toISOString(),
      city: order.city,
      items: (order.items ?? []).map((i) => {
        const v = this.mapper.item(i);
        return { productName: v.productName, quantity: v.quantity, lineTotal: v.lineTotal, imageUrl: v.imageUrl };
      }),
      total: order.total,
      timeline,
    };
  }
}
