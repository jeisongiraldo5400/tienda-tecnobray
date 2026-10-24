# TecnoBray · Frontend (tienda + panel)

Tienda en línea autoadministrable de **TecnoBray** (celulares, accesorios, audio, computadores) y su panel
`/admin`. Proyecto **independiente**: package.json, lockfile, scripts, pruebas y `.env.example` propios.
Despliegue en Vercel con *root directory* `frontend`.

- Next.js 16 (App Router, Turbopack, TypeScript estricto) · React 19
- Tailwind CSS 4 · lucide-react · sonner (toasts)
- TanStack Query (estado de servidor) · Zustand (carrito persistido en `localStorage`)
- Formik + Yup (formularios y validación) · Vitest + Testing Library

## Requisitos y arranque

```bash
cd frontend
pnpm install            # Node >= 22.12, pnpm 12
cp .env.example .env.local   # y completa REVALIDATE_SECRET (mismo valor que backend/.env)
pnpm dev                # http://localhost:3002 (el backend debe estar en http://127.0.0.1:4001)
```

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo en el puerto 3002 |
| `pnpm build` / `pnpm start` | Build de producción / servirlo en 3002 |
| `pnpm lint` | ESLint (config de Next) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unitarias y de componentes) |

## Variables de entorno

| Variable | Ejemplo | Uso |
|---|---|---|
| `API_BASE_URL` | `http://127.0.0.1:4001` | URL del backend (solo servidor: RSC/ISR y BFF) |
| `API_PREFIX` | `/api` | Prefijo global del backend |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3002` | URL pública (canonical, sitemap, Open Graph, JSON-LD) |
| `REVALIDATE_SECRET` | *(secreto)* | Secreto del webhook `POST /api/revalidate` (igual al del backend) |
| `BFF_SHARED_SECRET` | *(secreto)* | Solo servidor (nunca `NEXT_PUBLIC_`). Igual al del backend; el BFF lo envía como `X-BFF-Secret` + `X-BFF-Client-IP` |
| `ISR_REVALIDATE_SECONDS` | `300` | ISR por defecto de datos públicos |
| `NEXT_IMAGE_REMOTE_HOSTS` | `http://localhost:4001/api/media,https://*.cloudfront.net` | `next/image` remotePatterns (coma-separado; admite puerto y ruta) |
| `ADMIN_ACCESS_COOKIE` / `ADMIN_REFRESH_COOKIE` | `tb_at` / `tb_rt` | Cookies de sesión del backend |
| `NEXT_PUBLIC_CSRF_COOKIE` / `NEXT_PUBLIC_CSRF_HEADER` | `tb_csrf` / `x-csrf-token` | CSRF double-submit |

En producción: `API_BASE_URL` = URL de Railway, `NEXT_IMAGE_REMOTE_HOSTS` = host de la API (`/api/media`) o del CDN.
Hosts locales (localhost/127.0.0.1) solo se permiten para `next/image` fuera de producción.

## Arquitectura

```
src/
  app/                      Rutas (App Router)
    (store)/                Tienda pública (layout con header/footer/carrito)
    admin/login, admin/(panel)/…   Panel (layout verifica sesión con GET /auth/me)
    api/bff/[...path]       BFF: reenvía al backend (cookies, CSRF, Idempotency-Key, IP)
    api/revalidate          Webhook ISR protegido por secreto
    sitemap.ts, robots.ts, not-found.tsx, global-error.tsx
  proxy.ts                  "Middleware" de Next 16: protege /admin y renueva la sesión en el servidor
  features/<feature>/{components,hooks,services,adapters,store}
    catalog, home, product, cart, checkout, orders, settings, layout
    admin/{auth,shell,dashboard,products,categories,brands,banners,sections,settings,orders,customers,users}
  shared/{api,config,lib,providers,seo,server,types,ui}
```

- **Datos públicos**: componentes de servidor llaman directo a `API_BASE_URL` con `fetch` + `next.tags`
  (`settings`, `home`, `banners`, `categories`, `brands`, `products`, `product:<slug>`, `pages`, `page:<slug>`)
  e ISR. El backend llama `POST /api/revalidate` con `x-revalidate-secret` y `{ tags: [...] }` cuando cambia algo.
- **Navegador → BFF** (`/api/bff/*`): checkout, seguimiento y todo el panel. Así las cookies httpOnly son de
  primera parte en el dominio del frontend (Vercel ≠ Railway) y no hace falta CORS. El BFF valida la ruta,
  reenvía solo encabezados permitidos (descarta cualquier `X-BFF-*` o `X-Forwarded-For` del navegador), añade
  `X-BFF-Secret` y `X-BFF-Client-IP` (de `x-real-ip` o la primera IP de `x-forwarded-for`) para que el
  throttling del backend sea por cliente, y reescribe `Set-Cookie` (sin `Domain`, `Path=/`). Los `fetch` de
  servidor (RSC/ISR) envían solo `X-BFF-Secret`.
- **Sesión del panel**: `GET /auth/csrf` → `POST /auth/login` (con `X-CSRF-Token`) → cookies `tb_at`/`tb_rt`.
  `proxy.ts` redirige a `/admin/login` sin sesión y, si solo queda `tb_rt`, renueva la sesión antes de renderizar.
  En el cliente, un 401 dispara un `POST /auth/refresh` y un reintento; si falla, vuelve al login.
  Los permisos reales los valida el backend (rol `admin` / `editor`).
- **Checkout**: solo envía `productId` + `quantity` (el backend recalcula precios) con `Idempotency-Key`
  estable mientras el pedido no cambie (reintentos seguros). Un 409 de stock ajusta el carrito automáticamente.

## Rutas

Tienda: `/`, `/productos` (q, categoria, marca, min, max, orden, pagina en la URL), `/categoria/[slug]`,
`/producto/[slug]`, `/carrito`, `/checkout`, `/pedido/confirmacion?numero=`, `/seguimiento`,
`/politicas/[slug]`, `/sitemap.xml`, `/robots.txt`, 404 y 500.

Panel: `/admin/login`, `/admin` (dashboard), `/admin/pedidos`, `/admin/pedidos/[id]`,
`/admin/pedidos/[id]/imprimir`, `/admin/productos`, `/admin/productos/nuevo`, `/admin/productos/[id]`,
`/admin/categorias`, `/admin/marcas`, `/admin/banners`, `/admin/secciones`, `/admin/clientes`,
`/admin/configuracion` (general + páginas de políticas), `/admin/usuarios` (solo admin).

## Pruebas E2E (Playwright)

Requiere el backend en `:4001` y el frontend en `:3002` (si el frontend no está arriba, Playwright ejecuta `pnpm dev`).

```bash
pnpm exec playwright install chromium   # una sola vez
pnpm test:e2e                            # toda la suite
pnpm test:e2e --project=mobile           # solo tienda en móvil (390 px); también: tablet, desktop, a11y, admin
pnpm test:e2e:report                     # abrir el reporte HTML
```

- Proyectos: `mobile` (390 px), `tablet` (768 px) y `desktop` para la tienda; `a11y` (axe-core); `admin` (usa la sesión creada por `setup`).
- Credenciales: se leen de `backend/.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`); nunca se imprimen. Se pueden sobrescribir con `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`.
- La BD es compartida: todo dato de prueba lleva el prefijo `E2E ` (cliente "E2E Prueba", celular 3009990001) y se elimina en `afterAll`; los pedidos de prueba se cancelan. `e2e/global-teardown.ts` limpia restos. La configuración editada se restaura.
- Por la BD compartida corre con 1 worker; `E2E_WORKERS=3` lo acelera si nadie más usa la BD.
- Cada prueba falla si hay errores de consola, excepciones o respuestas HTTP ≥ 400 inesperadas (`e2e/support/fixtures.ts`).

## Despliegue en Vercel

Root directory `frontend`, framework Next.js, install `pnpm install`, build `pnpm build`. Configura las variables
de la tabla en *Project → Settings → Environment Variables*; `REVALIDATE_SECRET` y `BFF_SHARED_SECRET` como
variables sensibles (solo servidor), con el mismo valor que en el backend. En el backend: `FRONTEND_URL` = URL del sitio (webhook ISR) y el mismo `REVALIDATE_SECRET`.

## Seguridad de dependencias

`pnpm-workspace.yaml` exige versiones con ≥ 14 días de publicadas, con excepciones explícitas para parches de
seguridad: `next`/`eslint-config-next` 16.4.1 (RCE críticos en ≤ 16.4.0) y `zod` 4.6.6 (override, dependencia
de desarrollo) y `undici` 8.12.2 (override, dev vía jsdom). `pnpm audit`: sin vulnerabilidades.
`AGENTS.md` lo genera `next dev` automáticamente.
