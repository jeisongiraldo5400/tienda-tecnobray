import { Injectable } from '@nestjs/common';
import { MediaUrlService } from '../../storage/application/media-url.service';
import { ORDER_STATUS_LABELS } from '../domain/order-status';
import type { OrderItemEntity } from '../infrastructure/persistence/order-item.entity';
import type { OrderEntity } from '../infrastructure/persistence/order.entity';
import type { OrderItemView } from './orders.views';

@Injectable()
export class OrderMapper {
  constructor(private readonly media: MediaUrlService) {}

  item(i: OrderItemEntity): OrderItemView {
    return {
      productId: i.productId,
      productName: i.productName,
      productSlug: i.productSlug,
      sku: i.sku,
      imageUrl: this.media.url(i.imageKey),
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    };
  }

  statusLabel(o: OrderEntity): string {
    return ORDER_STATUS_LABELS[o.status];
  }
}
