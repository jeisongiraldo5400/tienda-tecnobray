# TecnoBray · Backend

API de la tienda TecnoBray: NestJS 12 + TypeORM 0.3 + PostgreSQL + S3. Proyecto independiente (su propio `package.json`, lockfile, `.env` y pruebas). El contrato para el frontend está en [`API.md`](./API.md) y en Swagger (`/docs`, JSON en `/docs-json`).

## Requisitos

- Node.js ≥ 22.12 y pnpm 12
- PostgreSQL 16 (desarrollo: base `tecnobray_tienda` en Railway con TLS verificado)
- Un bucket S3 (AWS) o compatible (MinIO/R2)
- Docker solo para las pruebas e2e (Postgres + MinIO locales)

## Puesta en marcha

```bash
cd backend
pnpm install
cp .env.example .env          # completa los valores (en este equipo ya existe backend/.env)
pnpm migration:run            # aplica las migraciones (nunca se usa synchronize)
pnpm seed                     # primer admin + configuración + páginas de políticas
pnpm seed:demo                # catálogo demo con imágenes subidas a S3 (public/demo/...)
pnpm start:dev                # http://localhost:4001  · Swagger: http://localhost:4001/docs
```

La contraseña del primer administrador está en `backend/.env`, variable `SEED_ADMIN_PASSWORD` (usuario: `SEED_ADMIN_EMAIL`). Para cambiarla: edita el valor y ejecuta `SEED_ADMIN_RESET=true pnpm seed`, o usa "Cambiar contraseña" en el panel.

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm start:dev` | Servidor con recarga (puerto `PORT`, 4001) |
| `pnpm build` / `pnpm start` | Compila a `dist/` y arranca en producción |
| `pnpm migration:run` / `migration:revert` | Migraciones con ts-node (dev) |
| `pnpm migration:generate src/database/migrations/Nombre` | Genera una migración a partir de las entidades |
| `pnpm migration:run:prod` | Migraciones desde `dist/` (Railway, pre-deploy) |
| `pnpm seed` | Admin inicial desde `SEED_ADMIN_*`, ajustes y políticas (idempotente) |
| `pnpm seed:demo [--reset\|--clean]` | Catálogo demo (29 productos, 7 categorías + subcategorías, 8 marcas, banners, secciones, 6 pedidos) |
| `pnpm storage:init` | MinIO: crea bucket y política pública de `public/*`. AWS: revisión **solo lectura** |
| `pnpm test` | Pruebas unitarias (Vitest + SWC) |
| `pnpm test:e2e` | Pruebas e2e contra Postgres y MinIO de docker-compose |
| `pnpm lint` / `pnpm typecheck` | ESLint y TypeScript |

## Arquitectura

```
src/
  main.ts / bootstrap.ts      Helmet, CORS, cookies, CSRF, ValidationPipe, filtro de errores, Swagger
  config/                     Validación de entorno (fail fast), SSL de BD, configuración tipada
  database/                   Opciones TypeORM, data-source de la CLI, migraciones
  common/                     Paginación, errores, seguridad (JWT guard, roles, CSRF, cookies), utilidades
  modules/<módulo>/
    domain/                   Reglas puras (estados del pedido, precios, stock público, puertos)
    application/              Casos de uso (servicios), DTOs y vistas
    infrastructure/
      http/                   Controladores (admin/* y store/*)
      persistence/            Entidades TypeORM
  scripts/                    seed, seed-demo, storage-init
```

Módulos: `auth`, `users`, `catalog` (productos, imágenes, categorías, marcas), `content` (banners, secciones, inicio), `settings` (tienda y políticas), `orders` (checkout, seguimiento, admin, clientes), `dashboard`, `storage` (S3), `revalidation` (webhook ISR), `health`.

### Decisiones

- **Precios**: enteros en COP, precio final con impuestos. El checkout recalcula todo en el servidor; el envío se coordina aparte (`shippingCost = 0`).
- **Stock**: se valida al crear el pedido, pero **se descuenta al confirmar** (transacción con `SELECT … FOR UPDATE` sobre el pedido y los productos en orden de id) y **se repone al cancelar** si ya se había descontado (`orders.stock_applied`). Así un pedido abandonado no bloquea inventario; el riesgo de sobreventa se resuelve al confirmar (409 si ya no alcanza).
- **Stock público**: la tienda solo recibe `inStock` y `maxQuantity = min(stock, 10)`.
- **Idempotencia**: `Idempotency-Key` obligatoria en checkout, única en BD, con hash del cuerpo.
- **Sesión**: access JWT 15 min en cookie httpOnly `tb_at`; refresh opaco rotatorio (`tb_rt`, path `/api/auth`) guardado como HMAC; reutilización ⇒ revoca todas las sesiones. CSRF double-submit (`tb_csrf` + `X-CSRF-Token`) en `/api/auth/*` y `/api/admin/*`. Login: 5/min por IP + bloqueo 15 min por correo tras 8 fallos.
- **IP real detrás del BFF**: sin `trust proxy` general. Solo las solicitudes con `X-BFF-Secret = BFF_SHARED_SECRET` pueden indicar la IP del cliente (`X-BFF-Client-IP` o primera IP de `X-Forwarded-For`) para el rate limiting; con secreto y sin IP (render en servidor) no se limita. Contraseñas con bcrypt (cost 12).
- **Contenido enriquecido**: Markdown → HTML con `marked` y `sanitize-html` (lista blanca estricta).

## Imágenes en S3

Todas las subidas (productos, miniaturas, categorías, banners, marcas, logo, favicon) usan el `StoragePort` con el adaptador `S3StorageAdapter` (`@aws-sdk/client-s3`). En pruebas unitarias se usa `InMemoryStorageAdapter`.

Flujo: el admin sube `multipart/form-data` al backend → validación por magic bytes (JPEG/PNG/WebP, máx. 5 MB, máx. 40 MP) → `sharp` aplica la orientación y descarta EXIF/GPS → variantes WebP (producto 1600 px + 400 px; banner 1920/640; categoría 800/400; marca 400; logo 512/192; favicon PNG 64/180) → `PutObject` con `Content-Type` y `Cache-Control: public, max-age=31536000, immutable` bajo `<S3_PREFIX>public/<carpeta>/<uuid>/<variante>.webp`. La BD guarda solo llaves; al borrar una imagen, producto, banner o categoría se eliminan sus objetos (best effort, se registra en el log).

### Variables

| Variable | Uso |
|---|---|
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME` | Obligatorias (el backend no arranca sin ellas) |
| `S3_PREFIX` | Prefijo opcional de todas las llaves |
| `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` | MinIO / R2 |
| `S3_PUBLIC_BASE_URL` | CloudFront o bucket público |
| `MEDIA_DELIVERY` | `proxy` (por defecto sin URL pública), `redirect` o `public` |

### Entrega de imágenes con bucket privado

El bucket `tecnobray` actual tiene **Block Public Access activado en sus 4 opciones, sin política de bucket, sin CORS y `BucketOwnerEnforced`** (revisado en solo lectura; no se cambió nada). Por eso el modo por defecto es `proxy`: las URLs son `${PUBLIC_API_URL}/api/media/<llave>` y el backend transmite el objeto desde S3 con caché de un año (las llaves son inmutables) y soporte de `ETag`/304. Solo se sirven llaves que cumplen `public/...(.webp|.png)`. Alternativa: `MEDIA_DELIVERY=redirect` (302 a una URL firmada de 1 h, cacheada en memoria).

### Producción recomendada: CloudFront con OAC

1. Mantén **Block Public Access activado** en el bucket.
2. Crea una distribución CloudFront con origen el bucket y **Origin Access Control (OAC)**; restringe el origin path a `/<S3_PREFIX>public` si quieres exponer solo esa carpeta.
3. Aplica la política de bucket que CloudFront propone (permite `s3:GetObject` solo al servicio CloudFront de esa distribución).
4. En el backend: `S3_PUBLIC_BASE_URL=https://dxxxx.cloudfront.net` (sin el prefijo; el backend lo agrega) y `MEDIA_DELIVERY=public`. En el frontend agrega ese host a `images.remotePatterns`.
5. CORS del bucket no es necesario: el navegador nunca sube directo a S3 (las subidas pasan por el backend) y las imágenes se cargan con `<img>`.

### Política IAM mínima para el usuario del backend

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TecnoBrayObjects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::tecnobray/*"
    },
    {
      "Sid": "TecnoBrayList",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::tecnobray"
    }
  ]
}
```

(Con `S3_PREFIX` puedes limitar el `Resource` a `arn:aws:s3:::tecnobray/<prefijo>/*` y el `ListBucket` con la condición `s3:prefix`.) `storage:init` usa además `s3:GetBucketPublicAccessBlock` y `s3:GetBucketPolicy` solo para el reporte; no son obligatorios.

### Cambiar entre MinIO y AWS (solo variables)

MinIO local (`docker compose --profile minio up -d` en la raíz):

```
AWS_ACCESS_KEY_ID=tecnobray-dev
AWS_SECRET_ACCESS_KEY=tecnobray-dev-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=tecnobray-media
S3_ENDPOINT=http://127.0.0.1:9010
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_BASE_URL=http://127.0.0.1:9010/tecnobray-media
```

luego `pnpm storage:init` (crea el bucket y la lectura pública de `public/*`). Para AWS basta quitar `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` y `S3_PUBLIC_BASE_URL` (o poner la de CloudFront) y usar las credenciales de AWS.

### Borrar las imágenes demo

Todo lo creado por `pnpm seed:demo` queda bajo `<S3_PREFIX>public/demo/`:

```bash
pnpm seed:demo --clean                                   # borra BD + objetos demo
aws s3 rm s3://tecnobray/public/demo/ --recursive        # alternativa directa (con S3_PREFIX: s3://tecnobray/<prefijo>/public/demo/)
```

## Pruebas

```bash
pnpm test                                   # 56 pruebas unitarias
docker compose --profile test up -d         # desde la raíz del repo: Postgres :55440 + MinIO :9010
pnpm test:e2e                               # 32 pruebas e2e (BD tecnobray_tienda_test + bucket MinIO tecnobray-media, prefijo e2e/)
```

Las e2e ignoran `backend/.env` y fijan su propio entorno (`test/e2e-env.ts`): nunca tocan Railway ni AWS.

## Despliegue en Railway

1. Nuevo servicio desde el repo con **Root Directory = `backend`** (usa `railway.json`: build `pnpm build`, pre-deploy `pnpm migration:run:prod`, start `pnpm start`, healthcheck `/api/health`).
2. Base de datos: Postgres de Railway (o el servidor compartido) con `DB_*`. Si la conexión es por el proxy público con TLS, define `DB_SSL=true`, `DB_SSL_CA_FILE` y `DB_SSL_SERVERNAME`; por la red privada de Railway puede ir sin TLS.
3. Variables: todas las de `.env.example` con valores de producción (`NODE_ENV=production`, `PUBLIC_API_URL=https://api.tudominio.com`, `FRONTEND_ORIGIN`/`FRONTEND_URL` = dominio de Vercel, `COOKIE_SECURE=true`, `BFF_SHARED_SECRET` (igual al del frontend), secretos JWT nuevos, `REVALIDATE_SECRET` igual al del frontend, credenciales S3).
4. Primer despliegue: `railway run pnpm seed:prod` (o ejecuta `pnpm seed` localmente apuntando a esa BD) para crear el administrador.
