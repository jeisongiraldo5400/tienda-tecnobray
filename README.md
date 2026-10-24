# TecnoBray · Tienda en línea autoadministrable

Tienda de tecnología **TecnoBray** con panel de administración propio. Es independiente de Vexto: tiene su propio backend, su propia base de datos (`tecnobray_tienda`) y su propio panel.

```
tecnobray-tienda/
├── backend/            API NestJS 12 + TypeORM + PostgreSQL + S3   → Railway (root: backend)
│   ├── API.md          Contrato de la API para el frontend (también Swagger en /docs)
│   └── README.md       Detalle del backend, S3/CloudFront, IAM, pruebas, despliegue
├── frontend/           Next.js 16 (tienda pública + panel /admin)   → Vercel (root: frontend)
├── docker-compose.yml  Solo pruebas e2e / alternativa local: Postgres 16 (:55440) y MinIO (:9010/:9011)
└── docker/             Script de inicialización de la BD de pruebas
```

`backend/` y `frontend/` son proyectos **totalmente independientes**: cada uno tiene su `package.json`, `pnpm-lock.yaml`, `.env`/`.env.example`, README, scripts y pruebas, y se despliega por separado. No hay workspace ni paquetes compartidos.

## Requisitos

- Node.js ≥ 22.12 y pnpm 12
- Acceso a la base `tecnobray_tienda` (Railway, TLS con CA) y a un bucket S3
- Docker (solo para pruebas e2e o MinIO local)

## Desarrollo local

```bash
# 1. Backend (puerto 4001)
cd backend
pnpm install
pnpm migration:run        # migraciones en la BD configurada en backend/.env
pnpm seed                 # crea el administrador inicial (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
pnpm seed:demo            # catálogo demo con imágenes en S3 (bajo public/demo/)
pnpm start:dev            # http://localhost:4001 · Swagger http://localhost:4001/docs

# 2. Frontend (puerto 3002) — en otra terminal; ver frontend/README.md
cd frontend
pnpm install
pnpm dev                  # http://localhost:3002 · panel http://localhost:3002/admin
```

- **Contraseña del administrador**: está en `backend/.env` (archivo ignorado por git), variable `SEED_ADMIN_PASSWORD`; el usuario es `SEED_ADMIN_EMAIL` (`admin@tecnobray.co`).
- **Secretos compartidos**: `REVALIDATE_SECRET` (webhook ISR) y `BFF_SHARED_SECRET` (IP real del cliente para el rate limiting) deben tener el mismo valor en `backend/.env` y en el entorno del frontend.
- Los puertos 3000, 3001 y 8082 los usa Vexto: no se tocan.

## Pruebas e2e del backend (Docker)

```bash
docker compose --profile test up -d     # Postgres de pruebas (127.0.0.1:55440) + MinIO (API :9010, consola :9011)
cd backend && pnpm test:e2e
```

Las e2e usan la base `tecnobray_tienda_test` y el bucket MinIO `tecnobray-media` (prefijo `e2e/`), nunca Railway ni AWS. `docker compose --profile minio up -d` levanta solo MinIO para desarrollar sin AWS (ver "Imágenes en S3" en `backend/README.md`).

## Calidad

| Proyecto | Comandos |
|---|---|
| backend | `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` · `pnpm audit` |
| frontend | `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm audit` |

Las dependencias se fijan a versiones exactas publicadas hace al menos 14 días (`minimumReleaseAge` en `pnpm-workspace.yaml` de cada proyecto). Las únicas excepciones son parches de seguridad recientes listados en `minimumReleaseAgeExclude`.

## Despliegue

### Backend + PostgreSQL → Railway

1. Servicio nuevo desde este repositorio con **Root Directory `backend`**. `backend/railway.json` define build (`pnpm build`), pre-deploy (`pnpm migration:run:prod`), start (`pnpm start`) y healthcheck (`/api/health`).
2. Postgres de Railway (o servidor existente) → variables `DB_*` (`DB_SSL=true` + `DB_SSL_CA_FILE` + `DB_SSL_SERVERNAME` si se conecta por el proxy TLS).
3. Resto de variables según `backend/.env.example`: `NODE_ENV=production`, `PUBLIC_API_URL`, `FRONTEND_ORIGIN`, `FRONTEND_URL`, `COOKIE_SECURE=true`, `BFF_SHARED_SECRET`, `JWT_*` nuevos, `REVALIDATE_SECRET`, `AWS_*`/`S3_*`, `SEED_ADMIN_*`.
4. Tras el primer despliegue: `railway run pnpm seed:prod` para crear el administrador.

### Frontend → Vercel

1. Proyecto nuevo con **Root Directory `frontend`** (framework Next.js, instalación con pnpm).
2. Variables de entorno según `frontend/.env.example` (URL de la API, `REVALIDATE_SECRET`, host de imágenes, URL pública del sitio).
3. Para que las cookies del panel sean de primera parte, el frontend proxifica `/api/*` hacia el backend (ver `backend/API.md`, sección 2).

### Imágenes

Ver `backend/README.md` → "Imágenes en S3": bucket privado + CloudFront con OAC (recomendado), política IAM mínima, y cómo cambiar entre MinIO y AWS solo con variables.

## Pendiente / próximos pasos

- Pasarela de pagos (Wompi, Mercado Pago o PayU): hoy el pedido se crea sin pago y se coordina por WhatsApp.
- Correos transaccionales (confirmación al cliente, aviso de nuevo pedido a la tienda) con SES/Resend.
- Costos de envío por ciudad / integración con transportadoras.
- CloudFront + OAC para servir imágenes sin pasar por el backend.
- Rate limiting distribuido (Redis) si el backend escala a varias instancias.
