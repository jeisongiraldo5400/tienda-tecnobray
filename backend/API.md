# TecnoBray API — contrato para el frontend

Backend NestJS independiente. Base URL local: `http://localhost:4001`. Todas las rutas llevan el prefijo **`/api`**.

- Swagger UI: `GET /docs` · OpenAPI JSON: `GET /docs-json` (fuente de verdad de los esquemas; este documento resume el contrato).
- Formato de datos: JSON UTF-8. Fechas en ISO 8601 (UTC). **Precios y totales: enteros en pesos colombianos (COP), precio final con impuestos incluidos**; el frontend formatea con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.
- Zona horaria de negocio: `America/Bogota` (dashboard y filtros por fecha).

---

## 1. Convenciones

### 1.1 Errores

Todas las respuestas de error tienen la misma forma:

```json
{
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "Texto en español apto para mostrar al usuario",
  "details": [ ... ],          // opcional
  "path": "/api/store/orders",
  "timestamp": "2026-10-23T22:10:00.000Z"
}
```

| Código | Cuándo |
|---|---|
| 400 | Validación (`details` = lista de mensajes de class-validator, en español cuando aplica) o regla de negocio |
| 401 | Sin sesión / sesión expirada (rutas admin) → intentar `POST /api/auth/refresh` una vez |
| 403 | Rol sin permiso, o **token CSRF inválido/ausente** |
| 404 | Recurso no encontrado |
| 409 | Conflicto: slug/SKU/correo duplicado, stock insuficiente, Idempotency-Key reutilizada con otro cuerpo |
| 413 | Imagen > 5 MB |
| 429 | Límite de solicitudes (throttling) |

Las propiedades desconocidas en el cuerpo se rechazan (400).

### 1.2 Paginación

Query: `page` (1..), `pageSize` (admin máx. 100, tienda máx. 48). Respuesta:

```json
{ "items": [ ... ], "total": 123, "page": 1, "pageSize": 20, "totalPages": 7 }
```

### 1.3 Imágenes (S3)

- Todas las imágenes viven en S3. La BD guarda solo llaves; la API siempre devuelve **URLs absolutas** listas para `<img>`/`next/image`.
- El bucket actual es **privado**, por eso por defecto (`MEDIA_DELIVERY=proxy`) las URLs apuntan al backend:
  `http://localhost:4001/api/media/public/products/<uuid>/1600.webp`.
  El backend transmite el objeto con `Cache-Control: public, max-age=31536000, immutable` (las llaves son inmutables).
  Con CloudFront (`MEDIA_DELIVERY=public` + `S3_PUBLIC_BASE_URL`) las URLs serán del CDN. **El frontend no debe construir URLs**: usar los campos `url`, `thumbUrl`, `imageUrl`, `logoUrl`, etc.
- `next.config` → `images.remotePatterns` debe permitir el host de la API (o del CDN), idealmente desde una variable de entorno (p. ej. `NEXT_PUBLIC_MEDIA_HOSTS` / derivado de la URL de la API).
- Variantes generadas (WebP, sin EXIF): producto 1600 px + miniatura 400 px; categoría 800/400; banner 1920/640; marca 400; logo 512 (`logoUrl`) y 192 (`logoSmallUrl`); favicon PNG 64 (`faviconUrl`) y 180 (`appleTouchIconUrl`).
- Subidas: `multipart/form-data`, JPEG/PNG/WebP validados por magic bytes, máx. 5 MB c/u.

### 1.4 Stock público

La tienda nunca recibe el stock real. Cada producto trae `inStock: boolean` y `maxQuantity: number` = `min(stock, 10)` (tope por producto por pedido, también en `settings.maxQuantityPerItem`).

---

## 2. Autenticación del panel (`/admin`)

Sesión por **cookies httpOnly**; el frontend nunca ve los tokens.

| Cookie | httpOnly | Path | Contenido | Vida |
|---|---|---|---|---|
| `tb_at` | sí | `/` | Access JWT (HS256) | 15 min |
| `tb_rt` | sí | `/api/auth` | Refresh token opaco, rotado en cada uso | 7 días |
| `tb_csrf` | **no** | `/` | Token CSRF (double-submit) | 12 h |

`SameSite=Lax`; `Secure` en producción (`COOKIE_SECURE`).

**CSRF:** toda solicitud `POST/PATCH/PUT/DELETE` a `/api/auth/*` y `/api/admin/*` debe incluir el encabezado `X-CSRF-Token` con el valor de la cookie `tb_csrf`. Si falta o no coincide → 403.

**Recomendado (mismo origen):** que el navegador hable con la API a través de un *rewrite* de Next (p. ej. `/api/:path*` → `${API_URL}/api/:path*`, o un prefijo propio como `/backend/:path*` → `${API_URL}/api/:path*`) para que las cookies sean de primera parte en el dominio del frontend (Vercel ≠ Railway). Las peticiones del servidor de Next (RSC/ISR) a rutas públicas pueden ir directo a `API_URL`. Ojo: la cookie `tb_rt` usa `Path=/api/auth`, así que el rewrite debe preservar la ruta `/api/auth/...` del lado del navegador **o** el frontend debe exponer el proxy bajo `/api/...`. Si el frontend usa otro prefijo, configurar `REFRESH_COOKIE_PATH` en el backend (p. ej. `/backend/auth`).

Flujo:

1. `GET /api/auth/csrf` → `{ "csrfToken": "..." }` y deja la cookie `tb_csrf`.
2. `POST /api/auth/login` (header `X-CSRF-Token`) body `{ "email", "password" }` → `200 { "user": UserView }` + cookies `tb_at`, `tb_rt` y un **nuevo** `tb_csrf` (releer la cookie después del login). Límite: 5 intentos/min por IP y bloqueo de 15 min por correo tras 8 fallos.
3. Llamadas admin con cookies (`credentials: 'include'` si es cross-origin).
4. Ante `401`: `POST /api/auth/refresh` (con `X-CSRF-Token`) → `200 { user }` y cookies renovadas; reintentar la petición original una vez. Si refresh responde 401 → ir a `/admin/login`.
5. `POST /api/auth/logout` → 204 y borra cookies.
6. `GET /api/auth/me` → `UserView`.
7. `PATCH /api/auth/password` `{ currentPassword, newPassword }` → 204 (cierra todas las sesiones; volver a iniciar sesión).

```ts
type Role = 'admin' | 'editor';
interface UserView { id: string; email: string; name: string; role: Role; active: boolean; lastLoginAt: string | null; createdAt: string }
```

Permisos: **editor** gestiona catálogo, contenido del inicio, pedidos y clientes, y puede ver configuración/páginas. **admin** además: usuarios, editar configuración, logo/favicon y páginas de políticas.

---

## 3. Tienda pública (`/api/store/*`, sin cookies)

Throttling global 300 req/min por IP; checkout y seguimiento 10 req/min; login 5 req/min.

**IP del cliente detrás del BFF.** El backend no confía en `X-Forwarded-For` en general (`TRUST_PROXY=false` por defecto). Las solicitudes del BFF de Next deben incluir:

| Encabezado | Valor |
|---|---|
| `X-BFF-Secret` | Secreto compartido: `BFF_SHARED_SECRET` (mismo valor en backend y frontend; solo servidor, nunca en el navegador) |
| `X-BFF-Client-IP` (preferido) o `X-Forwarded-For` | **Solo** la IP del cliente que el BFF determinó (p. ej. `x-real-ip` de Vercel). No reenviar el `X-Forwarded-For` que trae el navegador. Si se usa `X-Forwarded-For`, se toma la primera IP. |

Con secreto válido, el rate limiting se aplica por la IP del cliente. Con secreto válido y **sin** IP (render en servidor / ISR / generación de sitemap) la solicitud no se limita. Sin secreto, se usa la IP de la conexión y se ignoran los encabezados anteriores.

### Tipos compartidos

```ts
interface ImageView { url: string; thumbUrl: string; alt: string; width: number; height: number }

interface ProductCardView {
  id: string; slug: string; name: string; shortDescription: string;
  price: number; compareAtPrice: number | null; featured: boolean;
  inStock: boolean; maxQuantity: number;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  image: ImageView | null;
}

interface ProductDetailView extends Omit<ProductCardView, 'category'> {
  sku: string;
  descriptionHtml: string;              // HTML sanitizado en el servidor (renderizar con dangerouslySetInnerHTML)
  specs: { key: string; value: string }[];
  images: ImageView[];                  // la principal primero
  seo: { title: string; description: string };
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  updatedAt: string;
  related: ProductCardView[];           // hasta 8 de la misma categoría
}

interface CategoryNodeView {
  id: string; name: string; slug: string; description: string | null;
  imageUrl: string | null; thumbUrl: string | null;
  productCount: number;                 // en el padre incluye las hijas
  children: CategoryNodeView[];         // un solo nivel
}

interface BrandView { id: string; name: string; slug: string; logoUrl: string | null }

interface BannerView {
  id: string; title: string; text: string;
  linkUrl: string | null;               // ruta interna "/..." o URL https
  buttonText: string | null;
  imageUrl: string | null; thumbUrl: string | null;  // 1920 px / 640 px (móvil)
  sortOrder: number; active: boolean;
}

interface PublicSettingsView {
  storeName: string; tagline: string;
  logoUrl: string | null; logoSmallUrl: string | null;
  faviconUrl: string | null; appleTouchIconUrl: string | null;
  primaryColor: string; secondaryColor: string;          // #RRGGBB
  accentColor: string;                                   // #RRGGBB (botones de compra, descuentos); defecto #F97316
  seoTitle: string; seoDescription: string;              // SEO del inicio / Open Graph ('' = usar texto por defecto)
  announcement: string;                                  // barra superior ('' = ocultar)
  whatsapp: string;                                      // dígitos con indicativo, ej. 573001234567
  phone: string; email: string; address: string;
  social: Partial<Record<'facebook'|'instagram'|'tiktok'|'youtube'|'x', string>>;
  shippingInfo: string;                                  // texto plano (puede tener saltos de línea)
  maxQuantityPerItem: number;                            // 10
  updatedAt: string;
}
```

### Endpoints

| Método y ruta | Descripción | Respuesta | Etiqueta de caché sugerida |
|---|---|---|---|
| `GET /api/store/settings` | Configuración pública | `PublicSettingsView` | `settings` |
| `GET /api/store/home` | Inicio | `{ banners: BannerView[]; categories: CategoryNodeView[]; featured: ProductCardView[]; newest: ProductCardView[]; sections: { id; title; subtitle; products: ProductCardView[] }[] }` | `home` |
| `GET /api/store/categories` | Árbol de categorías activas | `CategoryNodeView[]` | `categories` |
| `GET /api/store/brands` | Marcas activas | `BrandView[]` | `brands` |
| `GET /api/store/filters` | Datos de filtros | `{ categories: CategoryNodeView[]; brands: BrandView[]; priceRange: { min: number; max: number } }` | `products` |
| `GET /api/store/products` | Catálogo (ver query) | `Paginated<ProductCardView>` | `products` |
| `GET /api/store/products/:slug` | Detalle | `ProductDetailView` (404 si no existe o está inactivo) | `product:<slug>` |
| `GET /api/store/pages` | Lista de políticas | `{ slug; title; updatedAt }[]` | `pages` |
| `GET /api/store/pages/:slug` | Política (`envios`, `garantias`, `devoluciones`, `privacidad`, `terminos`) | `{ slug; title; content (markdown); contentHtml (sanitizado); updatedAt }` | `page:<slug>` |
| `GET /api/store/sitemap` | Para `sitemap.xml` | `{ products: { slug; updatedAt }[]; categories: { slug; updatedAt }[] }` | `products` |
| `POST /api/store/orders` | Checkout | `201 OrderConfirmationView` | — |
| `POST /api/store/orders/track` | Seguimiento | `TrackingView` | — |
| `GET /api/media/<llave>` | Imagen (bucket privado) | binario | — |
| `GET /api/health` | Salud | `{ status, db, time }` | — |

**Query de `GET /api/store/products`:** `q` (nombre, SKU o marca), `category` (slug; incluye subcategorías), `brand` (slug o varios separados por coma), `minPrice`, `maxPrice`, `inStock=true`, `featured=true`, `sort` = `relevance` (defecto: disponibles → destacados → recientes) | `newest` | `price_asc` | `price_desc` | `name`, `page`, `pageSize` (defecto 24, máx. 48).

### Checkout

`POST /api/store/orders`

- Encabezado **obligatorio** `Idempotency-Key`: valor único por intento de compra (p. ej. `crypto.randomUUID()`), 8-100 caracteres `[A-Za-z0-9_-]`. Generarlo al entrar al checkout y reutilizarlo en reintentos del mismo envío. Mismo key + mismo cuerpo → devuelve el mismo pedido (`replayed: true`); mismo key + cuerpo distinto → 409.
- Cuerpo:

```json
{
  "customer": {
    "name": "Camila Restrepo",
    "phone": "300 123 4567",
    "email": "camila@correo.com",
    "city": "Medellín",
    "address": "Cra 43A # 1-50, apto 301",
    "notes": "Entregar en portería"
  },
  "items": [ { "productId": "uuid", "quantity": 2 } ]
}
```

Validaciones: `name` 3-120, `phone` `/^[0-9+()\s-]{7,20}$/`, `email` opcional (vacío → null), `city` 2-80, `address` 5-250, `notes` ≤ 500; `items` 1-50, `quantity` 1-10. **Los precios del cliente se ignoran**: el servidor recalcula con los precios actuales. No hay pasarela de pago todavía; el envío no se suma al total (`shippingCost` = 0, se coordina por WhatsApp).

- `409` si algún producto no está disponible: `details: Array<{ productId; reason: 'unavailable' | 'insufficient_stock' | 'quantity_limit'; name?; maxQuantity? }>` → actualizar el carrito con `maxQuantity` o quitar el producto.

```ts
interface OrderItemView { productId: string | null; productName: string; productSlug: string; sku: string; imageUrl: string | null; unitPrice: number; quantity: number; lineTotal: number }

interface OrderConfirmationView {
  number: string;                 // "TB-001001"
  status: 'nuevo' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';
  statusLabel: string;            // "Nuevo"
  createdAt: string;
  customer: { name: string; phone: string; email: string | null; city: string; address: string };
  notes: string | null;
  items: OrderItemView[];
  subtotal: number; shippingCost: number; total: number;
  whatsappUrl: string | null;     // https://wa.me/<tienda>?text=<resumen del pedido>; null si la tienda no tiene WhatsApp
  replayed: boolean;
}
```

### Seguimiento

`POST /api/store/orders/track` body `{ "number": "TB-001001", "phone": "3001234567" }` (el número acepta `TB-1001`, `tb001001`; el teléfono se compara solo por dígitos, con o sin `57`). 404 genérico si no coincide.

```ts
interface TrackingView {
  number: string; status: OrderStatus; statusLabel: string; createdAt: string; city: string;
  items: { productName: string; quantity: number; lineTotal: number; imageUrl: string | null }[];
  total: number;
  timeline: { status: OrderStatus; label: string; at: string }[];   // sin notas internas
}
```

---

## 4. Panel de administración (`/api/admin/*`)

Todas requieren la cookie `tb_at`; escrituras requieren `X-CSRF-Token`. `:id` son UUID (400 si no).

### Dashboard

`GET /api/admin/dashboard` →

```ts
{
  ordersToday: number; ordersWeek: number;
  salesToday: number; salesWeek: number; salesMonth: number; salesTotal: number;   // excluye cancelados
  pendingOrders: number;                                                          // estado "nuevo"
  ordersByStatus: Record<OrderStatus, number>;
  lowStockThreshold: number; lowStockCount: number;
  lowStock: { id; name; sku; stock; thumbUrl: string | null }[];                // máx. 10
  latestOrders: { id; number; customerName; total; status; createdAt }[];       // 10
}
```

### Productos

| Método y ruta | Cuerpo / query | Respuesta |
|---|---|---|
| `GET /api/admin/products` | `q`, `categoryId`, `brandId`, `active`, `featured`, `lowStock` (bool), `sort` = `newest`\|`oldest`\|`name`\|`price_asc`\|`price_desc`\|`stock_asc`, `page`, `pageSize` | `Paginated<AdminProductView>` |
| `GET /api/admin/products/:id` | — | `AdminProductView` |
| `POST /api/admin/products` | `CreateProductDto` | `201 AdminProductView` |
| `PATCH /api/admin/products/:id` | parcial de `CreateProductDto` | `AdminProductView` |
| `DELETE /api/admin/products/:id` | — | 204 (borra también sus objetos en S3) |
| `POST /api/admin/products/:id/images` | multipart, campo **`files`** (1-10 archivos) | `AdminProductImageView[]` (todas las del producto). Máx. 12 por producto. La primera subida queda como principal |
| `PATCH /api/admin/products/:id/images/reorder` | `{ imageIds: string[] }` (todas, en el nuevo orden) | `AdminProductImageView[]` |
| `PATCH /api/admin/products/:id/images/:imageId` | `{ alt?: string; isMain?: true }` | `AdminProductImageView[]` |
| `DELETE /api/admin/products/:id/images/:imageId` | — | `AdminProductImageView[]` |

```ts
interface CreateProductDto {
  name: string;                    // 2-200
  slug?: string;                   // /^[a-z0-9]+(?:-[a-z0-9]+)*$/; se genera del nombre si se omite
  sku: string;                     // /^[A-Za-z0-9._-]{2,64}$/
  brandId?: string | null; categoryId?: string | null;   // '' → null
  shortDescription?: string;       // ≤ 500
  description?: string;            // Markdown ≤ 20000; el servidor genera descriptionHtml sanitizado
  price: number;                   // entero COP ≥ 0
  compareAtPrice?: number | null;  // > price
  stock: number;                   // entero ≥ 0
  active?: boolean; featured?: boolean;
  specs?: { key: string; value: string }[];   // ≤ 40; key ≤ 60, value ≤ 200
  seoTitle?: string | null;        // ≤ 70
  seoDescription?: string | null;  // ≤ 170
}

interface AdminProductImageView { id; url; thumbUrl; largeKey; thumbKey; alt; width; height; sortOrder; isMain: boolean }

interface AdminProductView {
  id; name; slug; sku; brandId: string | null; categoryId: string | null;
  brand: { id; name } | null; category: { id; name } | null;
  shortDescription; description; descriptionHtml;
  price; compareAtPrice: number | null; stock; active; featured;
  specs: { key; value }[]; seoTitle: string | null; seoDescription: string | null;
  images: AdminProductImageView[];   // ordenadas por sortOrder
  mainImageThumbUrl: string | null;
  createdAt; updatedAt;
}
```

### Categorías y marcas

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/admin/categories` | — | `AdminCategoryView[]` (planas; armar el árbol con `parentId`) |
| `GET /api/admin/categories/:id` | — | `AdminCategoryView` |
| `POST /api/admin/categories` | `{ name; slug?; description?; parentId?; sortOrder?; active? }` | `201 AdminCategoryView` |
| `PATCH /api/admin/categories/:id` | parcial | `AdminCategoryView` |
| `DELETE /api/admin/categories/:id` | — | 204 (409 si tiene subcategorías; sus productos quedan sin categoría) |
| `POST /api/admin/categories/:id/image` | multipart campo **`file`** | `AdminCategoryView` |
| `DELETE /api/admin/categories/:id/image` | — | `AdminCategoryView` |
| `GET /api/admin/brands` | — | `AdminBrandView[]` |
| `POST /api/admin/brands` | `{ name; slug?; active? }` | `201 AdminBrandView` |
| `PATCH /api/admin/brands/:id` | parcial | `AdminBrandView` |
| `DELETE /api/admin/brands/:id` | — | 204 |
| `POST /api/admin/brands/:id/logo` | multipart **`file`** | `AdminBrandView` |
| `DELETE /api/admin/brands/:id/logo` | — | `AdminBrandView` (borra los objetos en S3) |

Solo un nivel de anidación: el padre debe ser raíz y una categoría con hijas no puede volverse hija (400).

```ts
interface AdminCategoryView { id; name; slug; description: string | null; parentId: string | null; imageUrl: string | null; thumbUrl: string | null; sortOrder; active; productCount; createdAt; updatedAt }
interface AdminBrandView { id; name; slug; logoUrl: string | null; active; productCount }
```

### Contenido del inicio

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/admin/banners` | — | `BannerView[]` |
| `POST /api/admin/banners` | `{ title; text?; linkUrl?; buttonText?; sortOrder?; active? }` | `201 BannerView` |
| `PATCH /api/admin/banners/:id` | parcial | `BannerView` |
| `DELETE /api/admin/banners/:id` | — | 204 |
| `POST /api/admin/banners/:id/image` | multipart **`file`** | `BannerView` |
| `DELETE /api/admin/banners/:id/image` | — | `BannerView` (borra los objetos en S3; sin imagen no se muestra en la tienda) |
| `GET /api/admin/sections` | — | `AdminSectionView[]` |
| `POST /api/admin/sections` | `{ title; subtitle?; productIds: string[] (≤ 24, ordenados); sortOrder?; active? }` | `201 AdminSectionView` |
| `PATCH /api/admin/sections/:id` | parcial | `AdminSectionView` |
| `DELETE /api/admin/sections/:id` | — | 204 |

Un banner se crea primero (sin imagen) y luego se sube su imagen; la tienda solo muestra banners activos con imagen.

```ts
interface AdminSectionView { id; title; subtitle; productIds: string[]; products: { id; name; sku; thumbUrl: string | null; active: boolean }[]; sortOrder; active }
```

### Configuración y páginas

| Método y ruta | Rol | Cuerpo | Respuesta |
|---|---|---|---|
| `GET /api/admin/settings` | ambos | — | `PublicSettingsView & { lowStockThreshold: number }` |
| `PATCH /api/admin/settings` | admin | `{ storeName?; tagline?; primaryColor?; secondaryColor?; accentColor?; seoTitle? (≤ 70); seoDescription? (≤ 170); announcement? (≤ 200); whatsapp? (/^\d{10,15}$/ o ''); phone?; email? (o ''); address?; social?: { facebook?; instagram?; tiktok?; youtube?; x? } (https o ''); shippingInfo? (≤ 2000); lowStockThreshold? }` | igual que GET |
| `POST /api/admin/settings/logo` | admin | multipart **`file`** | igual que GET |
| `DELETE /api/admin/settings/logo` | admin | — | igual que GET |
| `POST /api/admin/settings/favicon` | admin | multipart **`file`** | igual que GET |
| `DELETE /api/admin/settings/favicon` | admin | — | igual que GET (borra los objetos en S3) |
| `GET /api/admin/pages` | ambos | — | `PolicyPageView[]` |
| `GET /api/admin/pages/:slug` | ambos | — | `PolicyPageView` |
| `PATCH /api/admin/pages/:slug` | admin | `{ title?; content? (Markdown ≤ 50000) }` | `PolicyPageView` |

`PolicyPageView = { slug; title; content; contentHtml; updatedAt }`.

### Pedidos y clientes

| Método y ruta | Cuerpo / query | Respuesta |
|---|---|---|
| `GET /api/admin/orders` | `q` (número, nombre, correo, teléfono), `status`, `dateFrom`, `dateTo` (YYYY-MM-DD, hora Colombia, inclusive), `page`, `pageSize` | `Paginated<AdminOrderListItem>` |
| `GET /api/admin/orders/:id` | — | `AdminOrderDetail` |
| `PATCH /api/admin/orders/:id/status` | `{ status: OrderStatus; note?: string }` | `AdminOrderDetail` (400 transición inválida; 409 stock insuficiente al confirmar) |
| `POST /api/admin/orders/:id/notes` | `{ note: string }` (1-1000) | `AdminOrderDetail` |
| `GET /api/admin/customers` | `q`, `page`, `pageSize` | `Paginated<CustomerView>` |

Flujo de estados: `nuevo → confirmado → enviado → entregado`; `cancelado` desde `nuevo`, `confirmado` o `enviado`. `entregado` y `cancelado` son finales. Usar `allowedTransitions` del detalle para pintar los botones.

**Inventario:** el stock se descuenta **al confirmar** (transacción con bloqueo de filas) y se repone **al cancelar** si ya se había descontado (`stockApplied`). Crear un pedido no reserva stock.

```ts
interface AdminOrderListItem { id; number; status: OrderStatus; customerName; phone; email: string | null; city; total; itemsCount; createdAt }
interface AdminOrderDetail extends AdminOrderListItem {
  address; notes: string | null; subtotal; shippingCost; stockApplied: boolean;
  items: OrderItemView[];
  events: { id; type: 'created' | 'status_change' | 'note'; fromStatus: OrderStatus | null; toStatus: OrderStatus | null; note: string | null; userName: string | null; createdAt }[];
  allowedTransitions: OrderStatus[];
  whatsappUrl: string | null;   // wa.me del cliente
  updatedAt;
}
interface CustomerView { phone; name; email: string | null; city; ordersCount; totalSpent; firstOrderAt; lastOrderAt }
```

La vista imprimible del pedido la arma el frontend con `GET /api/admin/orders/:id`.

### Usuarios (solo admin)

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/admin/users` | — | `UserView[]` |
| `POST /api/admin/users` | `{ email; name; password (≥ 10); role }` | `201 UserView` |
| `PATCH /api/admin/users/:id` | `{ name?; role?; active?; password? }` | `UserView` |
| `DELETE /api/admin/users/:id` | — | 204 |

No se puede desactivar/degradar/eliminar la propia cuenta ni dejar la tienda sin administradores activos (400).

---

## 5. Revalidación ISR (webhook que expone el frontend)

Cuando cambian productos, categorías, marcas, banners, secciones, configuración o páginas, el backend llama (sin bloquear, timeout 5 s, errores solo se registran):

```
POST ${FRONTEND_URL}/api/revalidate
Content-Type: application/json
x-revalidate-secret: ${REVALIDATE_SECRET}

{ "tags": ["products", "product:celular-nova-x-128-gb", "home"] }
```

El frontend debe: validar el secreto (comparación en tiempo constante; 401 si no coincide), validar que `tags` sea un arreglo de strings (máx. ~50) y llamar `revalidateTag(tag, …)` para cada una; responder `200 { revalidated: true, tags }`.

Etiquetas emitidas: `products`, `product:<slug>`, `categories`, `brands`, `home`, `banners`, `settings`, `pages`, `page:<slug>`. Los `fetch` del frontend deben declarar `next: { tags: [...] }` con estas etiquetas (ver columna "Etiqueta de caché sugerida"). Confirmar o cancelar un pedido también revalida los productos afectados (cambia `inStock`).

`REVALIDATE_SECRET` debe ser el mismo valor en `backend/.env` y en el entorno del frontend. En desarrollo el valor ya está en `backend/.env` (variable `REVALIDATE_SECRET`); cópialo al `.env.local` del frontend.

---

## 6. Variables que el frontend necesita conocer

- URL de la API: `http://localhost:4001` (dev). En Railway, la URL pública del servicio.
- `BFF_SHARED_SECRET`: secreto para `X-BFF-Secret` (ver sección 3). En desarrollo el valor está en `backend/.env`; cópialo al `.env.local` del frontend con el mismo nombre.
- El backend permite CORS solo desde `FRONTEND_ORIGIN` (dev: `http://localhost:3002`), con `credentials: true` y encabezados `Content-Type`, `X-CSRF-Token`, `Idempotency-Key`.
- Host de imágenes para `next/image`: el mismo host de la API mientras `MEDIA_DELIVERY=proxy`.
