import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from './product.entity';

/** Solo se guardan las llaves S3; las URLs se construyen al responder. */
@Entity('product_images')
@Index('idx_product_images_product_sort', ['productId', 'sortOrder'])
export class ProductImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductEntity, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'large_key', type: 'varchar', length: 300 })
  largeKey: string;

  @Column({ name: 'thumb_key', type: 'varchar', length: 300 })
  thumbKey: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  alt: string;

  @Column({ type: 'int', default: 0 })
  width: number;

  @Column({ type: 'int', default: 0 })
  height: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_main', type: 'boolean', default: false })
  isMain: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
