import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../../domain/order-status';
import { OrderEventEntity } from './order-event.entity';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
@Index('idx_orders_status_created', ['status', 'createdAt'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Número legible: TB-001001 (secuencia order_number_seq). */
  @Index('uq_orders_number', { unique: true })
  @Column({ type: 'varchar', length: 20 })
  number: string;

  @Column({ type: 'enum', enum: OrderStatus, enumName: 'order_status', default: OrderStatus.Nuevo })
  status: OrderStatus;

  @Column({ name: 'customer_name', type: 'varchar', length: 120 })
  customerName: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  /** Solo dígitos, para búsqueda y agrupación de clientes. */
  @Index('idx_orders_phone_normalized')
  @Column({ name: 'phone_normalized', type: 'varchar', length: 20 })
  phoneNormalized: string;

  @Index('idx_orders_email')
  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 80 })
  city: string;

  @Column({ type: 'varchar', length: 250 })
  address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ type: 'int' })
  subtotal: number;

  @Column({ name: 'shipping_cost', type: 'int', default: 0 })
  shippingCost: number;

  @Column({ type: 'int' })
  total: number;

  @Column({ name: 'items_count', type: 'int' })
  itemsCount: number;

  /** true cuando el stock ya fue descontado (al confirmar). */
  @Column({ name: 'stock_applied', type: 'boolean', default: false })
  stockApplied: boolean;

  @Index('uq_orders_idempotency_key', { unique: true, where: '"idempotency_key" IS NOT NULL' })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 100, nullable: true })
  idempotencyKey: string | null;

  @Column({ name: 'request_hash', type: 'char', length: 64, nullable: true, select: false })
  requestHash: string | null;

  @OneToMany(() => OrderItemEntity, (i) => i.order, { cascade: ['insert'] })
  items: OrderItemEntity[];

  @OneToMany(() => OrderEventEntity, (e) => e.order, { cascade: ['insert'] })
  events: OrderEventEntity[];

  @Index('idx_orders_created')
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
