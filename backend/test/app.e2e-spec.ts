import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { ProductEntity } from '../src/modules/catalog/infrastructure/persistence/product.entity';
import { Role } from '../src/modules/users/domain/role';
import { cookieValue, createApp, createUser, login, objectExists, testPng } from './helpers';

const ADMIN = { email: 'admin.e2e@tecnobray.test', password: 'clave-admin-e2e-123' };
const EDITOR = { email: 'editor.e2e@tecnobray.test', password: 'clave-editor-e2e-123' };

describe('TecnoBray API (e2e)', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  let csrf: string;
  let productId: string;
  let productSlug: string;
  let imageKeys: { large: string; thumb: string };

  beforeAll(async () => {
    app = await createApp();
    await createUser(app, ADMIN.email, ADMIN.password, Role.Admin);
    await createUser(app, EDITOR.email, EDITOR.password, Role.Editor);
    agent = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());

  describe('salud y seguridad básica', () => {
    it('GET /api/health', async () => {
      const res = await http().get('/api/health').expect(200);
      expect(res.body).toMatchObject({ status: 'ok', db: 'ok' });
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('CORS solo para el origen del frontend', async () => {
      const ok = await http().options('/api/store/products').set('Origin', 'http://localhost:3002').set('Access-Control-Request-Method', 'GET');
      expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3002');
      const bad = await http().options('/api/store/products').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
      expect(bad.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('Swagger JSON disponible', async () => {
      const res = await http().get('/docs-json').expect(200);
      expect(res.body.paths['/api/store/orders']).toBeDefined();
    });
  });

  describe('autenticación', () => {
    it('rechaza login sin token CSRF', async () => {
      await http().post('/api/auth/login').send(ADMIN).expect(403);
    });

    it('rechaza credenciales inválidas con mensaje genérico', async () => {
      const a = request.agent(app.getHttpServer());
      const c = await a.get('/api/auth/csrf');
      const res = await a.post('/api/auth/login').set('X-CSRF-Token', c.body.csrfToken).send({ ...ADMIN, password: 'incorrecta-123' }).expect(401);
      expect(res.body.message).toBe('Correo o contraseña incorrectos.');
    });

    it('inicia sesión con cookies httpOnly', async () => {
      const c = await agent.get('/api/auth/csrf');
      const res = await agent.post('/api/auth/login').set('X-CSRF-Token', c.body.csrfToken).send(ADMIN).expect(200);
      expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'admin' });
      const cookies = (res.headers['set-cookie'] as unknown as string[]).join('\n');
      expect(cookies).toMatch(/tb_at=[^;]+;.*HttpOnly/);
      expect(cookies).toMatch(/tb_rt=[^;]+;.*Path=\/api\/auth;.*HttpOnly/);
      csrf = cookieValue(res, 'tb_csrf')!;
      await agent.get('/api/auth/me').expect(200);
    });

    it('rechaza escrituras admin sin CSRF aunque haya sesión', async () => {
      await agent.post('/api/admin/brands').send({ name: 'Sin CSRF' }).expect(403);
    });

    it('rota el refresh token y detecta reutilización', async () => {
      const a = request.agent(app.getHttpServer());
      const token = await login(a, EDITOR.email, EDITOR.password);
      const first = await a.post('/api/auth/refresh').set('X-CSRF-Token', token).expect(200);
      const oldRt = cookieValue(first, 'tb_rt');
      expect(oldRt).toBeDefined();
      await a.post('/api/auth/refresh').set('X-CSRF-Token', token).expect(200);
      // Reusar el token ya rotado revoca todas las sesiones.
      await http()
        .post('/api/auth/refresh')
        .set('Cookie', [`tb_rt=${oldRt}`, `tb_csrf=${token}`])
        .set('X-CSRF-Token', token)
        .expect(401);
      await a.post('/api/auth/refresh').set('X-CSRF-Token', token).expect(401);
    });

    it('el editor no puede gestionar usuarios', async () => {
      const a = request.agent(app.getHttpServer());
      await login(a, EDITOR.email, EDITOR.password);
      await a.get('/api/admin/users').expect(403);
      await a.get('/api/admin/products').expect(200);
    });

    it('rutas admin exigen sesión', async () => {
      await http().get('/api/admin/dashboard').expect(401);
    });
  });

  describe('catálogo e imágenes (S3/MinIO)', () => {
    let categoryId: string;
    let brandId: string;

    it('crea categoría, subcategoría y marca', async () => {
      const cat = await agent.post('/api/admin/categories').set('X-CSRF-Token', csrf).send({ name: 'Celulares E2E' }).expect(201);
      categoryId = cat.body.id;
      expect(cat.body.slug).toBe('celulares-e2e');
      const sub = await agent.post('/api/admin/categories').set('X-CSRF-Token', csrf).send({ name: 'Gama alta E2E', parentId: categoryId }).expect(201);
      await agent.post('/api/admin/categories').set('X-CSRF-Token', csrf).send({ name: 'Nivel 3', parentId: sub.body.id }).expect(400);
      const brand = await agent.post('/api/admin/brands').set('X-CSRF-Token', csrf).send({ name: 'Marca E2E' }).expect(201);
      brandId = brand.body.id;
    });

    it('crea un producto con descripción sanitizada', async () => {
      const res = await agent
        .post('/api/admin/products')
        .set('X-CSRF-Token', csrf)
        .send({
          name: 'Celular E2E 128 GB',
          sku: 'E2E-CEL-1',
          brandId,
          categoryId,
          price: 100000,
          compareAtPrice: 120000,
          stock: 3,
          description: '**Potente** <script>alert(1)</script>',
          specs: [{ key: 'RAM', value: '8 GB' }],
        })
        .expect(201);
      productId = res.body.id;
      productSlug = res.body.slug;
      expect(res.body.descriptionHtml).toContain('<strong>Potente</strong>');
      expect(res.body.descriptionHtml).not.toContain('script');
      await agent.post('/api/admin/products').set('X-CSRF-Token', csrf).send({ name: 'Dup', sku: 'E2E-CEL-1', price: 1, stock: 1 }).expect(409);
      await agent.post('/api/admin/products').set('X-CSRF-Token', csrf).send({ name: 'Mal', sku: 'E2E-2', price: 10, compareAtPrice: 5, stock: 1 }).expect(400);
    });

    it('sube imágenes a S3 (MinIO), genera variantes y las sirve', async () => {
      const res = await agent
        .post(`/api/admin/products/${productId}/images`)
        .set('X-CSRF-Token', csrf)
        .attach('files', await testPng(), 'foto.png')
        .attach('files', await testPng(800, 800), 'foto2.png')
        .expect(201);
      expect(res.body).toHaveLength(2);
      const [main] = res.body;
      expect(main.isMain).toBe(true);
      expect(main.largeKey).toMatch(/^public\/products\/[0-9a-f-]{36}\/1600\.webp$/);
      expect(main.url).toBe(`http://localhost:4001/api/media/${main.largeKey}`);
      imageKeys = { large: main.largeKey, thumb: main.thumbKey };
      expect(await objectExists(main.largeKey)).toBe(true);
      expect(await objectExists(main.thumbKey)).toBe(true);

      const media = await http().get(`/api/media/${main.thumbKey}`).expect(200);
      expect(media.headers['content-type']).toBe('image/webp');
      expect(media.headers['cache-control']).toContain('immutable');

      // MinIO: lectura pública solo bajo <prefijo>/public/
      const direct = await fetch(`http://127.0.0.1:9010/tecnobray-media/e2e/${main.thumbKey}`);
      expect(direct.status).toBe(200);

      // Reordenar y elegir principal
      const ids = res.body.map((i: { id: string }) => i.id).reverse();
      const reordered = await agent.patch(`/api/admin/products/${productId}/images/reorder`).set('X-CSRF-Token', csrf).send({ imageIds: ids }).expect(200);
      expect(reordered.body[0].id).toBe(ids[0]);
      const mainChanged = await agent.patch(`/api/admin/products/${productId}/images/${ids[0]}`).set('X-CSRF-Token', csrf).send({ isMain: true }).expect(200);
      expect(mainChanged.body.find((i: { isMain: boolean }) => i.isMain).id).toBe(ids[0]);
    });

    it('rechaza archivos que no son imágenes (magic bytes)', async () => {
      await agent
        .post(`/api/admin/products/${productId}/images`)
        .set('X-CSRF-Token', csrf)
        .attach('files', Buffer.from('<?php echo "hola"; ?> no soy una imagen'), { filename: 'falsa.png', contentType: 'image/png' })
        .expect(400);
      await http().get('/api/media/private/secret.webp').expect(404);
    });

    it('sube imagen de categoría', async () => {
      const res = await agent.post(`/api/admin/categories/${categoryId}/image`).set('X-CSRF-Token', csrf).attach('file', await testPng(), 'cat.png').expect(201);
      expect(res.body.imageUrl).toMatch(/\/api\/media\/public\/categories\//);
    });

    it('la tienda lista el producto sin exponer el stock real', async () => {
      const res = await http().get('/api/store/products').query({ q: 'celular e2e' }).expect(200);
      expect(res.body.total).toBe(1);
      const card = res.body.items[0];
      expect(card).toMatchObject({ slug: productSlug, inStock: true, maxQuantity: 3, price: 100000 });
      expect(card.stock).toBeUndefined();
      const detail = await http().get(`/api/store/products/${productSlug}`).expect(200);
      expect(detail.body.images).toHaveLength(2);
      expect(detail.body.stock).toBeUndefined();
      const byCat = await http().get('/api/store/products').query({ category: 'celulares-e2e' }).expect(200);
      expect(byCat.body.total).toBe(1);
      await http().get('/api/store/products/no-existe').expect(404);
    });
  });

  describe('checkout, seguimiento y flujo de estados', () => {
    const customer = { name: 'Cliente E2E', phone: '300 555 1234', email: 'cliente@e2e.test', city: 'Medellín', address: 'Calle 10 # 20-30' };
    let orderNumber: string;
    let orderId: string;

    it('exige Idempotency-Key', async () => {
      await http().post('/api/store/orders').send({ customer, items: [{ productId, quantity: 1 }] }).expect(400);
    });

    it('no acepta precios enviados por el cliente', async () => {
      await http()
        .post('/api/store/orders')
        .set('Idempotency-Key', randomUUID())
        .send({ customer, items: [{ productId, quantity: 1, unitPrice: 1 }] })
        .expect(400);
    });

    it('crea el pedido recalculando precios y es idempotente', async () => {
      const key = randomUUID();
      const body = { customer, items: [{ productId, quantity: 2 }] };
      const res = await http().post('/api/store/orders').set('Idempotency-Key', key).send(body).expect(201);
      expect(res.body).toMatchObject({ status: 'nuevo', subtotal: 200000, total: 200000, replayed: false });
      expect(res.body.number).toMatch(/^TB-\d{6}$/);
      expect(res.body.items[0]).toMatchObject({ unitPrice: 100000, quantity: 2, lineTotal: 200000 });
      orderNumber = res.body.number;

      const again = await http().post('/api/store/orders').set('Idempotency-Key', key).send(body).expect(201);
      expect(again.body).toMatchObject({ number: orderNumber, replayed: true });

      await http()
        .post('/api/store/orders')
        .set('Idempotency-Key', key)
        .send({ customer, items: [{ productId, quantity: 1 }] })
        .expect(409);
    });

    it('rechaza cantidades mayores al stock con detalle', async () => {
      const res = await http()
        .post('/api/store/orders')
        .set('Idempotency-Key', randomUUID())
        .send({ customer, items: [{ productId, quantity: 5 }] })
        .expect(409);
      expect(res.body.details[0]).toMatchObject({ productId, reason: 'insufficient_stock', maxQuantity: 3 });
    });

    it('seguimiento por número + teléfono', async () => {
      await http().post('/api/store/orders/track').send({ number: orderNumber, phone: '3009999999' }).expect(404);
      const res = await http().post('/api/store/orders/track').send({ number: orderNumber, phone: '+57 300-555-1234' }).expect(200);
      expect(res.body).toMatchObject({ number: orderNumber, status: 'nuevo', total: 200000 });
      expect(res.body.timeline).toHaveLength(1);
    });

    it('confirmar descuenta stock; cancelar lo repone', async () => {
      const list = await agent.get('/api/admin/orders').query({ q: orderNumber }).expect(200);
      orderId = list.body.items[0].id;

      await agent.patch(`/api/admin/orders/${orderId}/status`).set('X-CSRF-Token', csrf).send({ status: 'entregado' }).expect(400);

      const confirmed = await agent.patch(`/api/admin/orders/${orderId}/status`).set('X-CSRF-Token', csrf).send({ status: 'confirmado', note: 'Pago verificado' }).expect(200);
      expect(confirmed.body).toMatchObject({ status: 'confirmado', stockApplied: true });
      expect(confirmed.body.allowedTransitions).toEqual(['enviado', 'cancelado']);
      const stockAfter = await app.get(DataSource).getRepository(ProductEntity).findOneByOrFail({ id: productId });
      expect(stockAfter.stock).toBe(1);

      // Un segundo pedido de 1 unidad se puede crear, pero uno de 2 ya no.
      await http().post('/api/store/orders').set('Idempotency-Key', randomUUID()).send({ customer, items: [{ productId, quantity: 2 }] }).expect(409);

      const note = await agent.post(`/api/admin/orders/${orderId}/notes`).set('X-CSRF-Token', csrf).send({ note: 'Cliente pide factura' }).expect(201);
      expect(note.body.events.map((e: { type: string }) => e.type)).toEqual(['created', 'status_change', 'note']);

      const cancelled = await agent.patch(`/api/admin/orders/${orderId}/status`).set('X-CSRF-Token', csrf).send({ status: 'cancelado' }).expect(200);
      expect(cancelled.body).toMatchObject({ status: 'cancelado', stockApplied: false, allowedTransitions: [] });
      const restored = await app.get(DataSource).getRepository(ProductEntity).findOneByOrFail({ id: productId });
      expect(restored.stock).toBe(3);
    });

    it('confirmar sin stock suficiente responde 409', async () => {
      const mk = () =>
        http().post('/api/store/orders').set('Idempotency-Key', randomUUID()).send({ customer, items: [{ productId, quantity: 2 }] }).expect(201);
      const a = await mk();
      const b = await mk();
      const ids = await Promise.all(
        [a.body.number, b.body.number].map(async (n: string) => (await agent.get('/api/admin/orders').query({ q: n })).body.items[0].id),
      );
      await agent.patch(`/api/admin/orders/${ids[0]}/status`).set('X-CSRF-Token', csrf).send({ status: 'confirmado' }).expect(200);
      const res = await agent.patch(`/api/admin/orders/${ids[1]}/status`).set('X-CSRF-Token', csrf).send({ status: 'confirmado' }).expect(409);
      expect(res.body.message).toMatch(/Stock insuficiente/);
    });

    it('dashboard y clientes', async () => {
      const dash = await agent.get('/api/admin/dashboard').expect(200);
      expect(dash.body.ordersToday).toBeGreaterThanOrEqual(3);
      expect(dash.body.latestOrders.length).toBeGreaterThan(0);
      const customers = await agent.get('/api/admin/customers').query({ q: '300555' }).expect(200);
      expect(customers.body.items[0]).toMatchObject({ name: 'Cliente E2E', ordersCount: 3 });
    });
  });

  describe('configuración y borrado de imágenes', () => {
    it('guarda acento, SEO y anuncio y los expone en la tienda', async () => {
      const res = await agent
        .patch('/api/admin/settings')
        .set('X-CSRF-Token', csrf)
        .send({ accentColor: '#F97316', seoTitle: 'TecnoBray E2E', seoDescription: 'Descripción SEO', announcement: 'Envío gratis E2E' })
        .expect(200);
      expect(res.body).toMatchObject({ accentColor: '#F97316', seoTitle: 'TecnoBray E2E', announcement: 'Envío gratis E2E' });
      const pub = await http().get('/api/store/settings').expect(200);
      expect(pub.body).toMatchObject({ accentColor: '#F97316', seoTitle: 'TecnoBray E2E', seoDescription: 'Descripción SEO', announcement: 'Envío gratis E2E' });
      await agent.patch('/api/admin/settings').set('X-CSRF-Token', csrf).send({ accentColor: 'naranja' }).expect(400);
    });

    it('favicon, logo de marca e imagen de banner se pueden quitar (y se borran de S3)', async () => {
      const fav = await agent.post('/api/admin/settings/favicon').set('X-CSRF-Token', csrf).attach('file', await testPng(), 'f.png').expect(201);
      const favKey = new URL(fav.body.faviconUrl).pathname.replace('/api/media/', '');
      expect(await objectExists(favKey)).toBe(true);
      const noFav = await agent.delete('/api/admin/settings/favicon').set('X-CSRF-Token', csrf).expect(200);
      expect(noFav.body.faviconUrl).toBeNull();
      expect(await objectExists(favKey)).toBe(false);

      const brand = await agent.post('/api/admin/brands').set('X-CSRF-Token', csrf).send({ name: 'Marca Logo E2E' }).expect(201);
      const withLogo = await agent.post(`/api/admin/brands/${brand.body.id}/logo`).set('X-CSRF-Token', csrf).attach('file', await testPng(), 'l.png').expect(201);
      const logoKey = new URL(withLogo.body.logoUrl).pathname.replace('/api/media/', '');
      const noLogo = await agent.delete(`/api/admin/brands/${brand.body.id}/logo`).set('X-CSRF-Token', csrf).expect(200);
      expect(noLogo.body.logoUrl).toBeNull();
      expect(await objectExists(logoKey)).toBe(false);

      const banner = await agent.post('/api/admin/banners').set('X-CSRF-Token', csrf).send({ title: 'Banner E2E', linkUrl: '/productos' }).expect(201);
      const withImg = await agent.post(`/api/admin/banners/${banner.body.id}/image`).set('X-CSRF-Token', csrf).attach('file', await testPng(), 'b.png').expect(201);
      const bannerKey = new URL(withImg.body.imageUrl).pathname.replace('/api/media/', '');
      expect((await http().get('/api/store/home')).body.banners.some((b: { id: string }) => b.id === banner.body.id)).toBe(true);
      const noImg = await agent.delete(`/api/admin/banners/${banner.body.id}/image`).set('X-CSRF-Token', csrf).expect(200);
      expect(noImg.body.imageUrl).toBeNull();
      expect(await objectExists(bannerKey)).toBe(false);
      expect((await http().get('/api/store/home')).body.banners.some((b: { id: string }) => b.id === banner.body.id)).toBe(false);
    });
  });

  describe('limpieza de objetos en S3', () => {
    it('eliminar una imagen borra sus objetos', async () => {
      const product = await agent.get(`/api/admin/products/${productId}`).expect(200);
      const img = product.body.images.find((i: { largeKey: string }) => i.largeKey === imageKeys.large);
      await agent.delete(`/api/admin/products/${productId}/images/${img.id}`).set('X-CSRF-Token', csrf).expect(200);
      expect(await objectExists(imageKeys.large)).toBe(false);
      expect(await objectExists(imageKeys.thumb)).toBe(false);
    });

    it('eliminar el producto borra las imágenes restantes', async () => {
      const product = await agent.get(`/api/admin/products/${productId}`).expect(200);
      const keys = product.body.images.flatMap((i: { largeKey: string; thumbKey: string }) => [i.largeKey, i.thumbKey]);
      await agent.delete(`/api/admin/products/${productId}`).set('X-CSRF-Token', csrf).expect(204);
      for (const k of keys) expect(await objectExists(k)).toBe(false);
      // Los pedidos conservan el snapshot del producto.
      const orders = await agent.get('/api/admin/orders').expect(200);
      expect(orders.body.total).toBeGreaterThan(0);
    });

    it('logout borra la sesión', async () => {
      await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf).expect(204);
      await agent.get('/api/auth/me').expect(401);
    });
  });

  describe('rate limiting detrás del BFF', () => {
    const BFF = { 'X-BFF-Secret': 'e2e-bff-shared-secret-0123456789abcdef' };
    const track = (headers: Record<string, string>) =>
      http().post('/api/store/orders/track').set(headers).send({ number: 'TB-999999', phone: '3000000000' });

    it('X-Forwarded-For sin secreto no evita el límite (no se puede falsificar la IP)', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 12; i++) statuses.push((await track({ 'X-Forwarded-For': `203.0.113.${i}` })).status);
      expect(statuses).toContain(429);
    });

    it('con el secreto del BFF cada cliente tiene su propia cuota', async () => {
      const a: number[] = [];
      for (let i = 0; i < 11; i++) a.push((await track({ ...BFF, 'X-Forwarded-For': '198.51.100.10' })).status);
      expect(a.slice(0, 10).every((s) => s === 404)).toBe(true);
      expect(a[10]).toBe(429);
      expect((await track({ ...BFF, 'X-BFF-Client-IP': '198.51.100.20' })).status).toBe(404);
    });

    it('el BFF sin IP de cliente (render en servidor) no se limita', async () => {
      for (let i = 0; i < 12; i++) expect((await track(BFF)).status).toBe(404);
    });
  });
});
