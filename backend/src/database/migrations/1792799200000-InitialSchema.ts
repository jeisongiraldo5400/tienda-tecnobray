import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1792799200000 implements MigrationInterface {
    name = 'InitialSchema1792799200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "brands" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "logo_key" character varying(300), "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_brands_slug" ON "brands" ("slug") `);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(120) NOT NULL, "slug" character varying(140) NOT NULL, "description" character varying(500), "parent_id" uuid, "image_key" character varying(300), "image_thumb_key" character varying(300), "sort_order" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_categories_slug" ON "categories" ("slug") `);
        await queryRunner.query(`CREATE INDEX "idx_categories_parent" ON "categories" ("parent_id") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "sku" character varying(64) NOT NULL, "brand_id" uuid, "category_id" uuid, "short_description" character varying(500) NOT NULL DEFAULT '', "description" text NOT NULL DEFAULT '', "description_html" text NOT NULL DEFAULT '', "price" integer NOT NULL, "compare_at_price" integer, "stock" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "featured" boolean NOT NULL DEFAULT false, "specs" jsonb NOT NULL DEFAULT '[]'::jsonb, "seo_title" character varying(70), "seo_description" character varying(170), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_products_slug" ON "products" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_products_sku" ON "products" ("sku") `);
        await queryRunner.query(`CREATE INDEX "idx_products_brand" ON "products" ("brand_id") `);
        await queryRunner.query(`CREATE INDEX "idx_products_category" ON "products" ("category_id") `);
        await queryRunner.query(`CREATE INDEX "idx_products_active_price" ON "products" ("active", "price") `);
        await queryRunner.query(`CREATE INDEX "idx_products_active_created" ON "products" ("active", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_products_active_featured" ON "products" ("active", "featured") `);
        await queryRunner.query(`CREATE TABLE "product_images" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "product_id" uuid NOT NULL, "large_key" character varying(300) NOT NULL, "thumb_key" character varying(300) NOT NULL, "alt" character varying(200) NOT NULL DEFAULT '', "width" integer NOT NULL DEFAULT '0', "height" integer NOT NULL DEFAULT '0', "sort_order" integer NOT NULL DEFAULT '0', "is_main" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_product_images_product_sort" ON "product_images" ("product_id", "sort_order") `);
        await queryRunner.query(`CREATE TABLE "banners" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(120) NOT NULL, "text" character varying(300) NOT NULL DEFAULT '', "link_url" character varying(500), "button_text" character varying(40), "image_key" character varying(300), "image_thumb_key" character varying(300), "sort_order" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e9b186b959296fcb940790d31c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_banners_active_sort" ON "banners" ("active", "sort_order") `);
        await queryRunner.query(`CREATE TABLE "featured_sections" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(120) NOT NULL, "subtitle" character varying(300) NOT NULL DEFAULT '', "product_ids" jsonb NOT NULL DEFAULT '[]'::jsonb, "sort_order" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_84b0475329959bdba4cbc2a2d30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_featured_sections_active_sort" ON "featured_sections" ("active", "sort_order") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" uuid NOT NULL, "product_id" uuid, "product_name" character varying(200) NOT NULL, "product_slug" character varying(220) NOT NULL, "sku" character varying(64) NOT NULL, "image_key" character varying(300), "unit_price" integer NOT NULL, "quantity" integer NOT NULL, "line_total" integer NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id") `);
        await queryRunner.query(`CREATE INDEX "idx_order_items_product" ON "order_items" ("product_id") `);
        await queryRunner.query(`CREATE TYPE "public"."order_status" AS ENUM('nuevo', 'confirmado', 'enviado', 'entregado', 'cancelado')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "number" character varying(20) NOT NULL, "status" "public"."order_status" NOT NULL DEFAULT 'nuevo', "customer_name" character varying(120) NOT NULL, "phone" character varying(30) NOT NULL, "phone_normalized" character varying(20) NOT NULL, "email" character varying(160), "city" character varying(80) NOT NULL, "address" character varying(250) NOT NULL, "notes" character varying(500), "subtotal" integer NOT NULL, "shipping_cost" integer NOT NULL DEFAULT '0', "total" integer NOT NULL, "items_count" integer NOT NULL, "stock_applied" boolean NOT NULL DEFAULT false, "idempotency_key" character varying(100), "request_hash" character(64), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_orders_number" ON "orders" ("number") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_phone_normalized" ON "orders" ("phone_normalized") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_email" ON "orders" ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_orders_idempotency_key" ON "orders" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_orders_created" ON "orders" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_orders_status_created" ON "orders" ("status", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."order_event_type" AS ENUM('created', 'status_change', 'note')`);
        await queryRunner.query(`CREATE TABLE "order_events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "order_id" uuid NOT NULL, "type" "public"."order_event_type" NOT NULL, "from_status" "public"."order_status", "to_status" "public"."order_status", "note" character varying(1000), "user_id" uuid, "user_name" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cc1b82b0fcf1be577d9d7ecbf8b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_order_events_order_created" ON "order_events" ("order_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "policy_pages" ("slug" character varying(40) NOT NULL, "title" character varying(120) NOT NULL, "content" text NOT NULL DEFAULT '', "content_html" text NOT NULL DEFAULT '', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0db7f3362985dd8e1c5bfb4eb80" PRIMARY KEY ("slug"))`);
        await queryRunner.query(`CREATE TABLE "store_settings" ("id" integer NOT NULL DEFAULT '1', "store_name" character varying(80) NOT NULL DEFAULT 'TecnoBray', "tagline" character varying(160) NOT NULL DEFAULT '', "logo_key" character varying(300), "favicon_key" character varying(300), "primary_color" character varying(7) NOT NULL DEFAULT '#0F62FE', "secondary_color" character varying(7) NOT NULL DEFAULT '#111827', "whatsapp" character varying(20) NOT NULL DEFAULT '', "phone" character varying(30) NOT NULL DEFAULT '', "email" character varying(160) NOT NULL DEFAULT '', "address" character varying(250) NOT NULL DEFAULT '', "social" jsonb NOT NULL DEFAULT '{}'::jsonb, "shipping_info" text NOT NULL DEFAULT '', "low_stock_threshold" integer NOT NULL DEFAULT '5', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4da44f346b360f378f1489b6199" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('admin', 'editor')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(160) NOT NULL, "name" character varying(120) NOT NULL, "password_hash" character varying(100) NOT NULL, "role" "public"."user_role" NOT NULL DEFAULT 'editor', "active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "refresh_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "user_agent" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9190032f6967b7971dca07d69f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_refresh_sessions_user" ON "refresh_sessions" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_events" ADD CONSTRAINT "FK_b33cbf9a59cbee112d94bcb59de" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD CONSTRAINT "FK_a7ab4fd82c654c85b9de53d971a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP CONSTRAINT "FK_a7ab4fd82c654c85b9de53d971a"`);
        await queryRunner.query(`ALTER TABLE "order_events" DROP CONSTRAINT "FK_b33cbf9a59cbee112d94bcb59de"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_sessions_user"`);
        await queryRunner.query(`DROP TABLE "refresh_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
        await queryRunner.query(`DROP TABLE "store_settings"`);
        await queryRunner.query(`DROP TABLE "policy_pages"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_events_order_created"`);
        await queryRunner.query(`DROP TABLE "order_events"`);
        await queryRunner.query(`DROP TYPE "public"."order_event_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_status_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_created"`);
        await queryRunner.query(`DROP INDEX "public"."uq_orders_idempotency_key"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_email"`);
        await queryRunner.query(`DROP INDEX "public"."idx_orders_phone_normalized"`);
        await queryRunner.query(`DROP INDEX "public"."uq_orders_number"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."order_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_items_product"`);
        await queryRunner.query(`DROP INDEX "public"."idx_order_items_order"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."idx_featured_sections_active_sort"`);
        await queryRunner.query(`DROP TABLE "featured_sections"`);
        await queryRunner.query(`DROP INDEX "public"."idx_banners_active_sort"`);
        await queryRunner.query(`DROP TABLE "banners"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_images_product_sort"`);
        await queryRunner.query(`DROP TABLE "product_images"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_active_featured"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_active_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_active_price"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_brand"`);
        await queryRunner.query(`DROP INDEX "public"."uq_products_sku"`);
        await queryRunner.query(`DROP INDEX "public"."uq_products_slug"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_parent"`);
        await queryRunner.query(`DROP INDEX "public"."uq_categories_slug"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP INDEX "public"."uq_brands_slug"`);
        await queryRunner.query(`DROP TABLE "brands"`);
    }

}
