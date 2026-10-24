import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Configuración: color de acento, SEO del inicio y barra de anuncios. */
export class SettingsSeoAccent1792800000000 implements MigrationInterface {
  name = 'SettingsSeoAccent1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "accent_color" character varying(7) NOT NULL DEFAULT '#F97316'`);
    await queryRunner.query(`ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "seo_title" character varying(70) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "seo_description" character varying(170) NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "announcement" character varying(200) NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "announcement"`);
    await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "seo_description"`);
    await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "seo_title"`);
    await queryRunner.query(`ALTER TABLE "store_settings" DROP COLUMN "accent_color"`);
  }
}
