import { BackendApi } from '../support/api';
import { E2E } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';

test.describe('Acceso al panel', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sin sesión, las rutas /admin redirigen al login conservando el destino', async ({ page }) => {
    for (const path of ['/admin', '/admin/productos', '/admin/pedidos?estado=nuevo', '/admin/usuarios']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/admin/login\\?next=${encodeURIComponent(path).replace(/[?]/g, '\\?')}$`));
      await expect(page.getByRole('form', { name: 'Iniciar sesión' })).toBeVisible();
    }
    const res = await page.request.get('/admin/productos', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()['x-robots-tag']).toContain('noindex');
  });

  test('las rutas de la API del panel rechazan solicitudes sin sesión', async ({ request }) => {
    expect((await request.get('/api/bff/admin/dashboard')).status()).toBe(401);
    expect((await request.get('/api/bff/admin/users')).status()).toBe(401);
    expect((await request.patch('/api/bff/admin/settings', { data: { storeName: 'Hack' } })).status()).toBe(403);
  });

  test('contraseña incorrecta muestra un error y no inicia sesión', async ({ page, issues }) => {
    issues.allow(/http 401: POST .*\/api\/bff\/auth\/login/, /Failed to load resource.*401/);
    await page.goto('/admin/login');
    const email = page.getByLabel('Correo');
    await hydrated(email);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('Ingresa tu correo.')).toBeVisible();
    await expect(page.getByText('Ingresa tu contraseña.')).toBeVisible();

    await email.fill(E2E.adminEmail);
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta-e2e');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /incorrect|inválid|credenciales/i })).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toHaveValue('');
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await page.context().cookies()).some((c) => c.name === 'tb_at')).toBe(false);

    // Un login correcto posterior limpia el contador de fallos de la cuenta (bloqueo tras 8 intentos).
    const api = await BackendApi.create();
    await api.login();
    await api.dispose();
  });
});

test.describe('Dashboard', () => {
  test('muestra métricas, pedidos recientes y stock bajo', async ({ page }) => {
    const api = await BackendApi.create();
    const dash = await api.login().then((a) => a.get<{ pendingOrders: number; latestOrders: Array<{ number: string }>; lowStockCount: number }>('admin/dashboard'));
    await api.dispose();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: /^Hola,/ })).toBeVisible();
    for (const label of ['Pedidos hoy', 'Ventas hoy', 'Ventas del mes', 'Pendientes por confirmar']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /^Nuevo: \d+/ })).toHaveAttribute('href', '/admin/pedidos?estado=nuevo');
    if (dash.latestOrders.length > 0) {
      await expect(page.getByRole('link', { name: new RegExp(`#${dash.latestOrders[0]!.number}`) })).toBeVisible();
    }
    await expect(page.getByText(`Stock bajo (${dash.lowStockCount})`)).toBeVisible();

    // Navegación lateral: todas las secciones cargan sin errores.
    const nav = page.getByRole('navigation', { name: 'Menú del panel' });
    for (const [label, heading] of [
      ['Pedidos', 'Pedidos'],
      ['Productos', 'Productos'],
      ['Categorías', 'Categorías'],
      ['Marcas', 'Marcas'],
      ['Banners', 'Banners del inicio'],
      ['Secciones del inicio', /Secciones/],
      ['Clientes', 'Clientes'],
      ['Configuración', 'Configuración de la tienda'],
      ['Usuarios y roles', 'Usuarios y roles'],
    ] as const) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }
  });
});
