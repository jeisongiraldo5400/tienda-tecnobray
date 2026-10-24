import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('banners')
@Index('idx_banners_active_sort', ['active', 'sortOrder'])
export class BannerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 300, default: '' })
  text: string;

  @Column({ name: 'link_url', type: 'varchar', length: 500, nullable: true })
  linkUrl: string | null;

  @Column({ name: 'button_text', type: 'varchar', length: 40, nullable: true })
  buttonText: string | null;

  @Column({ name: 'image_key', type: 'varchar', length: 300, nullable: true })
  imageKey: string | null;

  @Column({ name: 'image_thumb_key', type: 'varchar', length: 300, nullable: true })
  imageThumbKey: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
