import { randomUUID } from 'node:crypto';
import { request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { E2E, E2E_CUSTOMER, E2E_PHONE, E2E_PREFIX } from './env';

/**
 * Cliente HTTP de apoyo para sembrar y limpiar datos de prueba directamente contra el backend.
 *
 * Se identifica como el servidor de Next (X-BFF-Secret sin IP de cliente), igual que el render en
 * servidor/ISR, para no consumir la cuota de throttling por IP que sí ejercitan las pruebas de UI.
 * Usa su propia sesión de administrador, independiente de la del navegador.
 */
export class BackendApi {
  private constructor(private readonly ctx: APIRequestContext) {}

  static async create(): Promise<BackendApi> {
    const ctx = await request.newContext({
      baseURL: `${E2E.apiURL}${E2E.apiPrefix}/`,
      extraHTTPHeaders: E2E.bffSecret ? { 'x-bff-secret': E2E.bffSecret } : {},
      // El runner aplicaría el storageState del proyecto (cookies del navegador): sesión propia y limpia.
      storageState: { cookies: [], origins: [] },
    });
    return new BackendApi(ctx);
  }

  /** Inicia sesión como el administrador semilla (cookies httpOnly en este contexto). */
  async login(): Promise<this> {
    await this.ok(await this.ctx.get('auth/csrf'), 'GET auth/csrf');
    const res = await this.ctx.post('auth/login', {
      headers: { [E2E.csrfHeader]: await this.csrf() },
      data: { email: E2E.adminEmail, password: E2E.adminPassword },
    });
    await this.ok(res, 'POST auth/login');
    return this;
  }

  async dispose(): Promise<void> {
    try {
      await this.ctx.post('auth/logout', { headers: { [E2E.csrfHeader]: await this.csrf() } });
    } catch {
      /* sin sesión */
    }
    await this.ctx.dispose();
  }

  private async csrf(): Promise<string> {
    const host = new URL(E2E.apiURL).hostname;
    const state = await this.ctx.storageState();
    return state.cookies.find((c) => c.name === E2E.csrfCookie && c.domain.replace(/^\./, '') === host)?.value ?? '';
  }

  private async ok(res: APIResponse, label: string): Promise<APIResponse> {
    if (!res.ok()) throw new Error(`${label} → ${res.status()} ${(await res.text()).slice(0, 300)}`);
    return res;
  }

  async get<T>(path: string): Promise<T> {
    return (await (await this.ok(await this.ctx.get(path), `GET ${path}`)).json()) as T;
  }

  async send<T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown): Promise<T> {
    const res = await this.ctx.fetch(path, { method, data, headers: { [E2E.csrfHeader]: await this.csrf() } });
    await this.ok(res, `${method} ${path}`);
    return (res.status() === 204 ? null : await res.json()) as T;
  }

  /** Igual que send pero devuelve el estado sin lanzar (para limpiezas idempotentes). */
  async trySend(method: 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown): Promise<number> {
    const res = await this.ctx.fetch(path, { method, data, headers: { [E2E.csrfHeader]: await this.csrf() } });
    return res.status();
  }

  // ---------- Dominio ----------

  async createProduct(input: { name: string; sku: string; price: number; stock: number; categoryId?: string | null; active?: boolean }) {
    if (!input.name.startsWith(E2E_PREFIX)) throw new Error('Los productos de prueba deben empezar por "E2E ".');
    return this.send<AdminProduct>('POST', 'admin/products', { active: true, ...input });
  }

  async getProduct(id: string) {
    return this.get<AdminProduct>(`admin/products/${id}`);
  }

  async listProducts(q: string) {
    return this.get<{ items: AdminProduct[] }>(`admin/products?q=${encodeURIComponent(q)}&pageSize=100`);
  }

  /** Crea un pedido como lo haría la tienda (cliente "E2E Prueba"). */
  async createOrder(items: Array<{ productId: string; quantity: number }>) {
    const res = await this.ctx.post('store/orders', {
      headers: { 'idempotency-key': randomUUID() },
      data: {
        customer: { name: E2E_CUSTOMER, phone: E2E_PHONE, email: '', city: 'Medellín', address: 'Calle 1 # 2-3, pruebas E2E', notes: 'Pedido de prueba automatizada' },
        items,
      },
    });
    await this.ok(res, 'POST store/orders');
    return (await res.json()) as { number: string; total: number };
  }

  async findOrderByNumber(number: string) {
    const page = await this.get<{ items: Array<{ id: string; number: string; status: string }> }>(
      `admin/orders?q=${encodeURIComponent(number)}&pageSize=10`,
    );
    const found = page.items.find((o) => o.number === number);
    if (!found) throw new Error(`Pedido ${number} no encontrado`);
    return found;
  }

  /** Cancela todos los pedidos abiertos del cliente de prueba (nunca toca otros pedidos). */
  async cancelOpenE2EOrders(): Promise<number> {
    let cancelled = 0;
    for (const status of ['nuevo', 'confirmado', 'enviado']) {
      const page = await this.get<{ items: Array<{ id: string; customerName: string; phone: string }> }>(
        `admin/orders?q=${E2E_PHONE}&status=${status}&pageSize=100`,
      );
      for (const o of page.items) {
        if (o.customerName !== E2E_CUSTOMER) continue;
        if ((await this.trySend('PATCH', `admin/orders/${o.id}/status`, { status: 'cancelado', note: 'Limpieza E2E' })) < 300) cancelled++;
      }
    }
    return cancelled;
  }

  /** Elimina todo lo creado por las pruebas (prefijo "E2E "). Red de seguridad para afterAll/teardown. */
  async sweepE2EData(): Promise<Record<string, number>> {
    const removed: Record<string, number> = { orders: await this.cancelOpenE2EOrders(), products: 0, categories: 0, brands: 0, banners: 0, users: 0 };

    const products = await this.listProducts('E2E');
    for (const p of products.items.filter((x) => x.name.startsWith(E2E_PREFIX))) {
      if ((await this.trySend('DELETE', `admin/products/${p.id}`)) < 300) removed.products!++;
    }
    const categories = (await this.get<Array<{ id: string; name: string; parentId: string | null }>>('admin/categories')).filter((c) =>
      c.name.startsWith(E2E_PREFIX),
    );
    // Primero las hijas (el backend impide borrar una categoría con subcategorías).
    for (const c of [...categories].sort((a, b) => Number(!!b.parentId) - Number(!!a.parentId))) {
      if ((await this.trySend('DELETE', `admin/categories/${c.id}`)) < 300) removed.categories!++;
    }
    for (const b of (await this.get<Array<{ id: string; name: string }>>('admin/brands')).filter((x) => x.name.startsWith(E2E_PREFIX))) {
      if ((await this.trySend('DELETE', `admin/brands/${b.id}`)) < 300) removed.brands!++;
    }
    for (const b of (await this.get<Array<{ id: string; title: string }>>('admin/banners')).filter((x) => x.title.startsWith(E2E_PREFIX))) {
      if ((await this.trySend('DELETE', `admin/banners/${b.id}`)) < 300) removed.banners!++;
    }
    for (const u of (await this.get<Array<{ id: string; name: string }>>('admin/users')).filter((x) => x.name.startsWith(E2E_PREFIX))) {
      if ((await this.trySend('DELETE', `admin/users/${u.id}`)) < 300) removed.users!++;
    }
    return removed;
  }
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  price: number;
  active: boolean;
  images: Array<{ id: string; isMain: boolean; sortOrder: number; url: string }>;
}

/** Datos públicos (sin sesión) leídos directamente del backend para no depender de valores fijos. */
export async function storeApi<T>(path: string): Promise<T> {
  const ctx = await request.newContext({
    baseURL: `${E2E.apiURL}${E2E.apiPrefix}/`,
    extraHTTPHeaders: E2E.bffSecret ? { 'x-bff-secret': E2E.bffSecret } : {},
    storageState: { cookies: [], origins: [] },
  });
  try {
    const res = await ctx.get(path.replace(/^\//, ''));
    if (!res.ok()) throw new Error(`GET ${path} → ${res.status()}`);
    return (await res.json()) as T;
  } finally {
    await ctx.dispose();
  }
}

export interface StoreProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  maxQuantity: number;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
}

export interface StoreProductDetail extends StoreProductCard {
  sku: string;
  images: Array<{ url: string; alt: string }>;
  specs: Array<{ key: string; value: string }>;
  related: StoreProductCard[];
  seo: { title: string; description: string };
}
