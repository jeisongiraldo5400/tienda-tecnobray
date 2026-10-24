import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderStatus } from '../../domain/order-status';
import { OrderEntity } from './order.entity';

export enum OrderEventType {
  Created = 'created',
  StatusChange = 'status_change',
  Note = 'note',
}

/** Historial del pedido: cambios de estado y notas internas. */
@Entity('order_events')
@Index('idx_order_events_order_created', ['orderId', 'createdAt'])
export class OrderEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => OrderEntity, (o) => o.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ type: 'enum', enum: OrderEventType, enumName: 'order_event_type' })
  type: OrderEventType;

  @Column({ name: 'from_status', type: 'enum', enum: OrderStatus, enumName: 'order_status', nullable: true })
  fromStatus: OrderStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: OrderStatus, enumName: 'order_status', nullable: true })
  toStatus: OrderStatus | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  note: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'user_name', type: 'varchar', length: 120, nullable: true })
  userName: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
