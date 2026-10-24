# Solicitudes al backend (desde el frontend)

Contrato revisado: `backend/API.md` (2026-10-23). El frontend ya está alineado con él; estos puntos son
mejoras o huecos detectados. Ninguno bloquea: el frontend usa valores por defecto mientras tanto.

## Importantes (producción)

1. **IP real del cliente detrás del BFF (throttling).** Todas las llamadas del navegador pasan por el BFF de Next
   (`/api/bff/*`), así que en Vercel el backend verá las IPs de Vercel. Con el límite de checkout/seguimiento
   (10 req/min por IP) todos los clientes compartirían cuota. El BFF envía `X-Forwarded-For: <ip del cliente>`
   (también `X-Forwarded-Host/Proto`). Pedido: en producción confiar en ese encabezado solo cuando venga del
   frontend (p. ej. `TRUST_PROXY` adecuado, o un encabezado secreto compartido `X-BFF-Secret` que habilite usar
   `X-Forwarded-For` para el throttler).
2. **Cookie `tb_rt` (`Path=/api/auth`).** No hace falta cambiar `REFRESH_COOKIE_PATH`: el BFF reescribe los
   `Set-Cookie` del backend (quita `Domain`, fuerza `Path=/`) para que las cookies sean de primera parte en el
   dominio del frontend y el `proxy.ts` pueda renovar la sesión del panel en el servidor. Solo informativo.

## Mejoras de contenido / configuración

3. `PublicSettingsView.accentColor` (#RRGGBB) para el color de acento (botones "Comprar ahora", insignias de
   descuento). Hoy el frontend usa `#f97316` por defecto.
4. `seoTitle` y `seoDescription` de la tienda en settings (título/descripción del inicio y Open Graph). Hoy se
   usan textos por defecto en español.
5. `announcement` (texto corto opcional para la barra superior). Hoy se usa la primera línea de `shippingInfo`.
6. `DELETE /api/admin/settings/favicon` (existe para el logo, no para el favicon).
7. Opcional: `DELETE /api/admin/brands/:id/logo` y `DELETE /api/admin/banners/:id/image` para quitar imágenes
   sin reemplazarlas.

## Verificado end-to-end (local)

`/store/home`, `/store/settings`, `/store/pages[/:slug]`, `/store/categories`, `/store/brands`,
`/store/products[/:slug]`, `/store/sitemap`, `POST /store/orders` (Idempotency-Key + replay),
`POST /store/orders/track`, `/auth/csrf|login|refresh|me|logout`, `/admin/dashboard`, `/admin/orders`
(+ cambio de estado), y el webhook `POST /api/revalidate` del frontend con `x-revalidate-secret`.

## Respuesta del backend (2026-10-23)

Implementado y documentado en `backend/API.md` (compatible hacia atrás):

1. **IP real detrás del BFF**: el backend NO usa `trust proxy` general. Si la solicitud trae
   `X-BFF-Secret: <BFF_SHARED_SECRET>`, el throttler usa `X-BFF-Client-IP` (preferido) o la primera IP de
   `X-Forwarded-For`. El BFF debe enviar solo la IP que él determinó (p. ej. `x-real-ip` de Vercel), no reenviar
   el `X-Forwarded-For` del navegador. Con el secreto y sin IP (render en servidor / ISR) no se aplica límite.
   - **Variable del frontend:** `BFF_SHARED_SECRET` (solo servidor; NO `NEXT_PUBLIC_`). Mismo valor que
     `BFF_SHARED_SECRET` en `backend/.env` (ya generado ahí; copiarlo a `frontend/.env.local`).
   - Recomendado: enviar `X-BFF-Secret` también en los `fetch` de servidor (RSC/ISR) a `/api/store/*`.
2. `tb_rt`: sin cambios (el BFF reescribe Path).
3–5. `PublicSettingsView` y `PATCH /api/admin/settings` incluyen `accentColor` (#RRGGBB, defecto `#F97316`),
   `seoTitle` (≤ 70), `seoDescription` (≤ 170) y `announcement` (≤ 200). Cadena vacía = usar valor por defecto /
   ocultar la barra. Migración `SettingsSeoAccent1792800000000` aplicada; el seed llenó valores iniciales.
6. `DELETE /api/admin/settings/favicon` (rol admin).
7. `DELETE /api/admin/brands/:id/logo` y `DELETE /api/admin/banners/:id/image`. Todos borran los objetos en S3.

## Estado en el frontend (2026-10-23)

Todo lo anterior ya está conectado: `X-BFF-Secret` + `X-BFF-Client-IP` en el BFF (y solo el secreto en los
`fetch` de servidor), `accentColor`/`seoTitle`/`seoDescription`/`announcement` en tienda y formulario de
configuración, y los `DELETE` de favicon, logo de marca e imagen de banner (con confirmación) en el panel.
