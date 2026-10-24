import { randomBytes } from 'node:crypto';
import { BackendApi } from '../support/api';
import { RUN_ID } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';

const EDITOR_NAME = `E2E Editor ${RUN_ID}`;
const EDITOR_EMAIL = `e2e.editor.${RUN_ID}@tecnobray.test`;
// Contraseña aleatoria por corrida (nunca se imprime).
const EDITOR_PASSWORD = `E2e-${randomBytes(12).toString('base64url')}`;

test.describe.configure({ mode: 'serial' });

test.describe('Usuarios y roles', () => {
  test.afterAll(async () => {
    const api = await BackendApi.create();
    try {
      await api.login();
      const users = await api.get<Array<{ id: string; email: string }>>('admin/users');
      const editor = users.find((u) => u.email === EDITOR_EMAIL);
      if (editor) await api.trySend('DELETE', `admin/users/${editor.id}`);
    } finally {
      await api.dispose();
    }
  });

  test('crear un usuario editor (con validaciones)', async ({ page }) => {
    await page.goto('/admin/usuarios');
    const add = page.getByRole('button', { name: 'Nuevo usuario' });
    await hydrated(add);
    await add.click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo usuario' });
    await dialog.getByLabel('Correo').fill(EDITOR_EMAIL);
    await dialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill(EDITOR_NAME);
    await dialog.getByLabel('Contraseña').fill('corta');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByText('Mínimo 10 caracteres.')).toBeVisible();
    await expect(dialog.getByLabel('Rol')).toHaveValue('editor');
    await dialog.getByLabel('Contraseña').fill(EDITOR_PASSWORD);
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Usuario creado.')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: EDITOR_EMAIL });
    await expect(row).toContainText(EDITOR_NAME);
    await expect(row).toContainText('Editor');
    await expect(row).toContainText('Nunca');
    // La propia cuenta no se puede eliminar.
    await expect(page.getByRole('row').filter({ hasText: '(tú)' }).getByRole('button', { name: /^Eliminar/ })).toHaveCount(0);
  });

  test('el editor inicia sesión, ve solo lo permitido, cierra sesión y pierde el acceso', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    try {
      await page.goto('/admin/productos');
      await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproductos$/);
      const email = page.getByLabel('Correo');
      await hydrated(email);
      await email.fill(EDITOR_EMAIL);
      await page.getByLabel('Contraseña').fill(EDITOR_PASSWORD);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      // Vuelve al destino solicitado tras iniciar sesión.
      await expect(page).toHaveURL(/\/admin\/productos$/);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Productos');

      const nav = page.getByRole('navigation', { name: 'Menú del panel' });
      await expect(nav.getByRole('link', { name: 'Productos' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Usuarios y roles' })).toHaveCount(0);
      await expect(page.getByText(`${EDITOR_EMAIL} · Editor`)).toBeVisible();

      // /admin/usuarios es solo para administradores: el servidor redirige al inicio del panel.
      await page.goto('/admin/usuarios');
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole('heading', { level: 1, name: /^Hola,/ })).toBeVisible();

      await page.goto('/admin/configuracion');
      await expect(page.getByText(/Solo lectura/)).toBeVisible();
      await expect(page.getByLabel('Nombre de la tienda')).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Guardar configuración' })).toHaveCount(0);

      // El backend también lo impide (no solo la UI): 403 al intentar escribir configuración o listar usuarios.
      const csrf = (await context.cookies()).find((c) => c.name === 'tb_csrf')?.value ?? '';
      const patch = await page.request.patch('/api/bff/admin/settings', { data: { tagline: 'hack' }, headers: { 'x-csrf-token': csrf } });
      expect(patch.status()).toBe(403);
      expect((await page.request.get('/api/bff/admin/users')).status()).toBe(403);
      // Lo que sí puede: catálogo y pedidos.
      expect((await page.request.get('/api/bff/admin/orders?pageSize=1')).status()).toBe(200);

      // Cerrar sesión.
      await page.goto('/admin');
      const logout = page.getByRole('button', { name: 'Cerrar sesión' });
      await hydrated(logout);
      await logout.click();
      await expect(page).toHaveURL(/\/admin\/login$/);
      expect((await context.cookies()).some((c) => c.name === 'tb_at' || c.name === 'tb_rt')).toBe(false);
      for (const path of ['/admin', '/admin/pedidos']) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin\/login\?next=/);
      }
      expect((await page.request.get('/api/bff/admin/dashboard')).status()).toBe(401);
    } finally {
      await context.close();
    }
  });

  test('editar y eliminar el editor', async ({ page }) => {
    await page.goto('/admin/usuarios');
    const row = page.getByRole('row').filter({ hasText: EDITOR_EMAIL });
    await expect(row).not.toContainText('Nunca'); // registró su último ingreso
    await row.getByRole('button', { name: `Editar ${EDITOR_NAME}` }).click();
    const dialog = page.getByRole('dialog', { name: 'Editar usuario' });
    await expect(dialog.getByLabel('Correo')).toBeDisabled();
    await dialog.getByRole('switch', { name: 'Activo' }).click();
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Usuario actualizado.')).toBeVisible();
    await expect(row).toContainText('Inactivo');

    await row.getByRole('button', { name: `Eliminar ${EDITOR_NAME}` }).click();
    await page.getByRole('dialog', { name: `¿Eliminar a ${EDITOR_NAME}?` }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Usuario eliminado.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
