import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - Búsqueda: extensión pg_trgm (extensión "trusted", la puede crear el dueño de la BD)
 *   e índices GIN trigram sobre nombre y SKU para ILIKE '%texto%'.
 * - Números de pedido legibles con una secuencia (TB-001001, TB-001002, ...).
 * - Fila única de configuración y páginas de políticas iniciales.
 */
export class SearchAndSequences1792799300000 implements MigrationInterface {
  name = 'SearchAndSequences1792799300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_name_trgm" ON "products" USING gin (lower("name") gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_sku_trgm" ON "products" USING gin (lower("sku") gin_trgm_ops)`,
    );
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START WITH 1001 INCREMENT BY 1`);
    await queryRunner.query(`INSERT INTO "store_settings" ("id") VALUES (1) ON CONFLICT ("id") DO NOTHING`);
    await queryRunner.query(
      `INSERT INTO "policy_pages" ("slug", "title") VALUES
        ('envios', 'Política de envíos'),
        ('garantias', 'Garantías'),
        ('devoluciones', 'Cambios y devoluciones'),
        ('privacidad', 'Política de privacidad'),
        ('terminos', 'Términos y condiciones')
       ON CONFLICT ("slug") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "order_number_seq"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_sku_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_products_name_trgm"`);
  }
}
