import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BrandEntity } from './brand.entity';
import { CategoryEntity } from './category.entity';
import { ProductImageEntity } from './product-image.entity';

export interface ProductSpec {
  key: string;
  value: string;
}

/** Precios en pesos colombianos (enteros, precio final con impuestos incluidos). */
@Entity('products')
@Index('idx_products_active_featured', ['active', 'featured'])
@Index('idx_products_active_created', ['active', 'createdAt'])
@Index('idx_products_active_price', ['active', 'price'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Index('uq_products_slug', { unique: true })
  @Column({ type: 'varchar', length: 220 })
  slug: string;

  @Index('uq_products_sku', { unique: true })
  @Column({ type: 'varchar', length: 64 })
  sku: string;

  @Index('idx_products_brand')
  @Column({ name: 'brand_id', type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => BrandEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity | null;

  @Index('idx_products_category')
  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => CategoryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity | null;

  @Column({ name: 'short_description', type: 'varchar', length: 500, default: '' })
  shortDescription: string;

  /** Descripción larga en Markdown (fuente editable). */
  @Column({ type: 'text', default: '' })
  description: string;

  /** HTML generado desde Markdown y sanitizado en el servidor. */
  @Column({ name: 'description_html', type: 'text', default: '' })
  descriptionHtml: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ name: 'compare_at_price', type: 'int', nullable: true })
  compareAtPrice: number | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  specs: ProductSpec[];

  @Column({ name: 'seo_title', type: 'varchar', length: 70, nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'varchar', length: 170, nullable: true })
  seoDescription: string | null;

  @OneToMany(() => ProductImageEntity, (i) => i.product)
  images: ProductImageEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
