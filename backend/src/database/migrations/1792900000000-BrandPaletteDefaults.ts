import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Valores por defecto de los colores de la tienda con la paleta del logo de TecnoBray.
 * Solo cambia los DEFAULT de las columnas (no modifica filas existentes: eso lo hace `pnpm brand:apply`).
 */
export class BrandPaletteDefaults1792900000000 implements MigrationInterface {
  name = 'BrandPaletteDefaults1792900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "store_settings" ALTER COLUMN "primary_color" SET DEFAULT '#0B1E3F'`);
    await queryRunner.query(`ALTER TABLE "store_settings" ALTER COLUMN "secondary_color" SET DEFAULT '#071630'`);
    await queryRunner.query(`ALTER TABLE "store_settings" ALTER COLUMN "accent_color" SET DEFAULT '#84C43A'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "store_settings" ALTER COLUMN "accent_color" SET DEFAULT '#F97316'`);
    await queryRunner.query(`ALTER TABLE "store_settings" ALTER COLUMN "secondary_color" SET DEFAULT '#111827'`);
    await queryRunner.query(`ALTER TABLE "store_settings" ALTER COLUMN "primary_color" SET DEFAULT '#0F62FE'`);
  }
}
