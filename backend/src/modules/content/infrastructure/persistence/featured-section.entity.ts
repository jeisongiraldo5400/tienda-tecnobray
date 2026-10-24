import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Sección destacada del inicio: lista ordenada de productos elegidos a mano. */
@Entity('featured_sections')
@Index('idx_featured_sections_active_sort', ['active', 'sortOrder'])
export class FeaturedSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  subtitle: string;

  @Column({ name: 'product_ids', type: 'jsonb', default: () => "'[]'::jsonb" })
  productIds: string[];

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
