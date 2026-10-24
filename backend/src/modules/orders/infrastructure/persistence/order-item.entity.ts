import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from '../../../catalog/infrastructure/persistence/product.entity';
import { OrderEntity } from './order.entity';

/** Copia (snapshot) de los datos del producto al momento de la compra. */
@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_order_items_order')
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Index('idx_order_items_product')
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @ManyToOne(() => ProductEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity | null;

  @Column({ name: 'product_name', type: 'varchar', length: 200 })
  productName: string;

  @Column({ name: 'product_slug', type: 'varchar', length: 220 })
  productSlug: string;

  @Column({ type: 'varchar', length: 64 })
  sku: string;

  @Column({ name: 'image_key', type: 'varchar', length: 300, nullable: true })
  imageKey: string | null;

  @Column({ name: 'unit_price', type: 'int' })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'line_total', type: 'int' })
  lineTotal: number;
}
