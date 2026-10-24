import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('policy_pages')
export class PolicyPageEntity {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  slug: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  /** Markdown editable desde el admin. */
  @Column({ type: 'text', default: '' })
  content: string;

  /** HTML sanitizado generado desde `content`. */
  @Column({ name: 'content_html', type: 'text', default: '' })
  contentHtml: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
