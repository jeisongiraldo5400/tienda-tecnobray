import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { DataSource, In, Like } from 'typeorm';
import { AppModule } from '../app.module';
import { BrandsService } from '../modules/catalog/application/brands.service';
import { CategoriesService } from '../modules/catalog/application/categories.service';
import { ProductsService } from '../modules/catalog/application/products.service';
import { BrandEntity } from '../modules/catalog/infrastructure/persistence/brand.entity';
import { CategoryEntity } from '../modules/catalog/infrastructure/persistence/category.entity';
import { ProductEntity } from '../modules/catalog/infrastructure/persistence/product.entity';
import { ContentService } from '../modules/content/application/content.service';
import { BannerEntity } from '../modules/content/infrastructure/persistence/banner.entity';
import { FeaturedSectionEntity } from '../modules/content/infrastructure/persistence/featured-section.entity';
import { CheckoutService } from '../modules/orders/application/checkout.service';
import { OrdersAdminService } from '../modules/orders/application/orders-admin.service';
import { OrderStatus } from '../modules/orders/domain/order-status';
import { OrderEntity } from '../modules/orders/infrastructure/persistence/order.entity';
import { SettingsService } from '../modules/settings/application/settings.service';
import { BRAND_COLORS } from '../modules/settings/domain/brand';
import { ImageUploadService } from '../modules/storage/application/image-upload.service';
import { Role } from '../modules/users/domain/role';
import { UserEntity } from '../modules/users/infrastructure/persistence/user.entity';
import { DEMO_BANNERS, DEMO_BRANDS, DEMO_CATEGORIES, DEMO_PRODUCTS } from './demo/demo-catalog';
import { bannerImage, categoryImage, logoImage, productImage } from './demo/demo-images';

config({ quiet: true });

/**
 * Datos de demostración de TecnoBray. Todas las imágenes pasan por el mismo código de
 * subida a S3 que usa el admin y quedan bajo `<S3_PREFIX>public/demo/...`.
 *
 *   pnpm seed:demo            crea el catálogo si no existe
 *   pnpm seed:demo --reset    borra los datos demo (BD + objetos S3) y los vuelve a crear
 *   pnpm seed:demo --clean    solo borra los datos demo
 *   pnpm seed:demo --orders   solo crea los pedidos demo (si no existen)
 */
async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const frontendUrl = process.env.FRONTEND_URL;
  const revalidateSecret = process.env.REVALIDATE_SECRET;
  delete process.env.FRONTEND_URL; // evita cientos de webhooks durante el seed; se revalida una vez al final

  const log = new Logger('SeedDemo');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  try {
    const ds = app.get(DataSource);
    const products = app.get(ProductsService);
    const categories = app.get(CategoriesService);
    const brands = app.get(BrandsService);
    const content = app.get(ContentService);
    const settings = app.get(SettingsService);
    const uploads = app.get(ImageUploadService);

    const demoSkus = DEMO_PRODUCTS.map((p) => p.sku);
    if (args.has('--orders')) {
      const rows = await ds.getRepository(ProductEntity).find({ where: { sku: In(demoSkus) }, select: { id: true, sku: true } });
      await demoOrders(app, ds, new Map(rows.map((r) => [r.sku, r.id])), log);
      return;
    }
    const already = await ds.getRepository(ProductEntity).count({ where: { sku: In(demoSkus) } });

    if (args.has('--reset') || args.has('--clean')) {
      await clean(ds, products, categories, brands, content, uploads, log);
      if (args.has('--clean')) return;
    } else if (already > 0) {
      log.log(`El catálogo demo ya existe (${already} productos). Usa --reset para recrearlo.`);
      return;
    }

    // Logo y favicon
    const s = await settings.entity();
    if (!s.logoKey) await settings.setLogo(await logoImage(s.primaryColor || BRAND_COLORS.primary), true);
    if (!s.faviconKey) await settings.setFavicon(await logoImage(s.primaryColor || BRAND_COLORS.primary), true);
    log.log('Logo y favicon listos');

    // Marcas
    const brandIds = new Map<string, string>();
    for (const name of DEMO_BRANDS) {
      const b = await brands.create({ name });
      brandIds.set(name, b.id);
    }

    // Categorías (con imagen subida a S3)
    const catIds = new Map<string, string>();
    const catColors = new Map<string, [string, string]>();
    const catRepo = ds.getRepository(CategoryEntity);
    let order = 0;
    for (const c of DEMO_CATEGORIES) {
      const root = await categories.create({ name: c.name, slug: c.slug, description: c.description, sortOrder: order++ });
      catIds.set(c.slug, root.id);
      catColors.set(c.slug, c.color);
      const img = await uploads.upload(await categoryImage(c.name, c.icon, c.color), 'category', { demo: true });
      await catRepo.update(root.id, { imageKey: img.largeKey, imageThumbKey: img.thumbKey });
      let childOrder = 0;
      for (const ch of c.children ?? []) {
        const child = await categories.create({ name: ch.name, slug: ch.slug, description: ch.description, parentId: root.id, sortOrder: childOrder++ });
        catIds.set(ch.slug, child.id);
        catColors.set(ch.slug, c.color);
        const cimg = await uploads.upload(await categoryImage(ch.name, c.icon, c.color), 'category', { demo: true });
        await catRepo.update(child.id, { imageKey: cimg.largeKey, imageThumbKey: cimg.thumbKey });
      }
    }
    log.log(`Categorías: ${catIds.size}`);

    // Productos con imágenes
    const createdIds: string[] = [];
    for (const [i, p] of DEMO_PRODUCTS.entries()) {
      const description = [
        p.short,
        '',
        '### Lo más destacado',
        ...p.highlights.map((h) => `- ${h}`),
        '',
        '### Qué incluye',
        `- ${p.name}`,
        '- Manual y garantía TecnoBray',
        '',
        '_Imágenes ilustrativas de demostración._',
      ].join('\n');
      const created = await products.create({
        name: p.name,
        sku: p.sku,
        brandId: brandIds.get(p.brand) ?? null,
        categoryId: catIds.get(p.category) ?? null,
        shortDescription: p.short,
        description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        active: true,
        featured: p.featured ?? false,
        specs: p.specs.map(([key, value]) => ({ key, value })),
        seoTitle: `${p.name} | TecnoBray`.slice(0, 70),
        seoDescription: p.short.slice(0, 170),
      });
      const colors = catColors.get(p.category) ?? ['#0F62FE', '#6929C4'];
      const buffers: Buffer[] = [];
      for (let v = 0; v < (p.images ?? 1); v++) {
        buffers.push(await productImage({ name: p.name, brand: p.brand, icon: p.icon, colors, variant: v }));
      }
      await products.addImages(created.id, buffers, { demo: true });
      createdIds.push(created.id);
      // Fechas de creación escalonadas para que "Novedades" tenga orden natural.
      await ds.getRepository(ProductEntity).update(created.id, { createdAt: new Date(Date.now() - (DEMO_PRODUCTS.length - i) * 3600_000) });
      log.log(`Producto ${i + 1}/${DEMO_PRODUCTS.length}: ${p.name}`);
    }

    // Banners
    for (const [i, b] of DEMO_BANNERS.entries()) {
      const banner = await content.createBanner({ title: b.title, text: b.text, linkUrl: b.linkUrl, buttonText: b.buttonText, sortOrder: i });
      await content.setBannerImage(banner.id, await bannerImage(b.title, b.text, b.icon, b.colors), true);
    }
    log.log('Banners listos');

    // Secciones destacadas
    const bySku = new Map(DEMO_PRODUCTS.map((p, i) => [p.sku, createdIds[i]]));
    await content.createSection({
      title: 'Ofertas de la semana',
      subtitle: 'Precios especiales por tiempo limitado',
      productIds: ['TB-CEL-001', 'TB-PC-001', 'TB-AUD-001', 'TB-ACC-001', 'TB-WAT-001', 'TB-TAB-001', 'TB-MON-001', 'TB-GAM-002'].map((s) => bySku.get(s)!),
      sortOrder: 0,
    });
    await content.createSection({
      title: 'Arma tu setup',
      subtitle: 'Monitores, teclados y audio para trabajar o jugar',
      productIds: ['TB-MON-001', 'TB-MON-002', 'TB-GAM-002', 'TB-GAM-001', 'TB-GAM-003', 'TB-AUD-002'].map((s) => bySku.get(s)!),
      sortOrder: 1,
    });

    await demoOrders(app, ds, bySku, log);
  } finally {
    await app.close();
    if (frontendUrl && revalidateSecret) {
      try {
        await fetch(`${frontendUrl.replace(/\/+$/, '')}/api/revalidate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-revalidate-secret': revalidateSecret },
          body: JSON.stringify({ tags: ['products', 'categories', 'brands', 'home', 'banners', 'settings', 'pages'] }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        /* el frontend puede no estar corriendo */
      }
    }
  }
}

async function demoOrders(
  app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>,
  ds: DataSource,
  bySku: Map<string, string>,
  log: Logger,
): Promise<void> {
  const existing = await ds.getRepository(OrderEntity).count({ where: { idempotencyKey: Like('demo-%') } });
  if (existing > 0) return;
  const checkout = app.get(CheckoutService, { strict: false });
  const orders = app.get(OrdersAdminService, { strict: false });
  const admin = await ds.getRepository(UserEntity).findOne({ where: { role: Role.Admin } });
  const actor = admin
    ? { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    : { id: randomUUID(), email: 'demo@tecnobray.co', name: 'Demo', role: Role.Admin };
  const customers = [
    { name: 'Camila Restrepo', phone: '3001112233', email: 'camila.demo@example.com', city: 'Medellín', address: 'Cra 43A # 1-50, apto 301' },
    { name: 'Andrés Gómez', phone: '3104445566', email: 'andres.demo@example.com', city: 'Bogotá', address: 'Calle 93 # 11-20' },
    { name: 'Valentina Ríos', phone: '3207778899', email: null, city: 'Cali', address: 'Av. 6N # 23-45' },
    { name: 'Juan Pablo Ospina', phone: '3159990011', email: 'juanp.demo@example.com', city: 'Barranquilla', address: 'Cra 53 # 76-120' },
  ];
  const plan: Array<{ c: number; items: Array<[string, number]>; to: OrderStatus[] }> = [
    { c: 0, items: [['TB-CEL-004', 1], ['TB-ACC-004', 1]], to: [OrderStatus.Confirmado, OrderStatus.Enviado, OrderStatus.Entregado] },
    { c: 1, items: [['TB-PC-001', 1]], to: [OrderStatus.Confirmado, OrderStatus.Enviado] },
    { c: 2, items: [['TB-AUD-002', 2]], to: [OrderStatus.Confirmado] },
    { c: 3, items: [['TB-PAR-001', 1], ['TB-ACC-002', 2]], to: [] },
    { c: 0, items: [['TB-WAT-002', 1]], to: [OrderStatus.Cancelado] },
    { c: 1, items: [['TB-GAM-001', 1], ['TB-ACC-001', 1]], to: [] },
  ];
  for (const p of plan) {
    const conf = await checkout.placeOrder(
      { customer: { ...customers[p.c], notes: null }, items: p.items.map(([sku, quantity]) => ({ productId: bySku.get(sku)!, quantity })) },
      `demo-${randomUUID()}`,
    );
    const order = await ds.getRepository(OrderEntity).findOneOrFail({ where: { number: conf.number } });
    for (const status of p.to) await orders.changeStatus(order.id, status, 'Movimiento de demostración', actor);
  }
  log.log(`Pedidos demo: ${plan.length}`);
}

async function clean(
  ds: DataSource,
  products: ProductsService,
  categories: CategoriesService,
  brands: BrandsService,
  content: ContentService,
  uploads: ImageUploadService,
  log: Logger,
): Promise<void> {
  const prodRows = await ds.getRepository(ProductEntity).find({ where: { sku: In(DEMO_PRODUCTS.map((p) => p.sku)) } });
  for (const p of prodRows) await products.remove(p.id);
  await ds.getRepository(FeaturedSectionEntity).clear();
  const banners = await ds.getRepository(BannerEntity).find({ where: { imageKey: Like('public/demo/%') } });
  for (const b of banners) await content.removeBanner(b.id);
  const slugs = DEMO_CATEGORIES.flatMap((c) => [...(c.children ?? []).map((ch) => ch.slug), c.slug]);
  for (const slug of slugs) {
    const c = await ds.getRepository(CategoryEntity).findOne({ where: { slug } });
    if (c) await categories.remove(c.id);
  }
  const brandRows = await ds.getRepository(BrandEntity).find({ where: { name: In(DEMO_BRANDS) } });
  for (const b of brandRows) await brands.remove(b.id);
  await ds.query(`DELETE FROM orders WHERE idempotency_key LIKE 'demo-%'`);
  const s = await ds.query(`SELECT logo_key, favicon_key FROM store_settings WHERE id = 1`);
  const keys: string[] = [];
  if (s[0]?.logo_key?.startsWith('public/demo/')) keys.push(s[0].logo_key, s[0].logo_key.replace('/512.webp', '/192.webp'));
  if (s[0]?.favicon_key?.startsWith('public/demo/')) keys.push(s[0].favicon_key, s[0].favicon_key.replace('/64.png', '/180.png'));
  if (keys.length) {
    await ds.query(
      `UPDATE store_settings SET logo_key = CASE WHEN logo_key LIKE 'public/demo/%' THEN NULL ELSE logo_key END,
                                 favicon_key = CASE WHEN favicon_key LIKE 'public/demo/%' THEN NULL ELSE favicon_key END WHERE id = 1`,
    );
    await uploads.remove(keys);
  }
  log.log('Datos demo eliminados (BD y objetos S3 bajo public/demo/)');
}

main().catch((err: Error) => {
  console.error(`✖ Seed demo falló: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
