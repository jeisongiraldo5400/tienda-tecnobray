import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { BRAND_COLORS } from '../../domain/brand';

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  x?: string;
}

/** Fila única (id = 1) con la configuración de la tienda. */
@Entity('store_settings')
export class StoreSettingsEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ name: 'store_name', type: 'varchar', length: 80, default: 'TecnoBray' })
  storeName: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  tagline: string;

  @Column({ name: 'logo_key', type: 'varchar', length: 300, nullable: true })
  logoKey: string | null;

  @Column({ name: 'favicon_key', type: 'varchar', length: 300, nullable: true })
  faviconKey: string | null;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, default: BRAND_COLORS.primary })
  primaryColor: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, default: BRAND_COLORS.secondary })
  secondaryColor: string;

  /** Color de acento (botones de compra, insignias de descuento). */
  @Column({ name: 'accent_color', type: 'varchar', length: 7, default: BRAND_COLORS.accent })
  accentColor: string;

  /** Título SEO del inicio / Open Graph. Vacío = el frontend usa su valor por defecto. */
  @Column({ name: 'seo_title', type: 'varchar', length: 70, default: '' })
  seoTitle: string;

  @Column({ name: 'seo_description', type: 'varchar', length: 170, default: '' })
  seoDescription: string;

  /** Texto corto opcional para la barra de anuncios superior. */
  @Column({ type: 'varchar', length: 200, default: '' })
  announcement: string;

  /** Número de WhatsApp en formato internacional sin "+" (ej. 573001234567). */
  @Column({ type: 'varchar', length: 20, default: '' })
  whatsapp: string;

  @Column({ type: 'varchar', length: 30, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  email: string;

  @Column({ type: 'varchar', length: 250, default: '' })
  address: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  social: SocialLinks;

  @Column({ name: 'shipping_info', type: 'text', default: '' })
  shippingInfo: string;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
  lowStockThreshold: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
