import type { Page } from '@playwright/test';
import { BackendApi } from '../support/api';
import { E2E_CUSTOMER, E2E_PHONE, RUN_ID } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';

const INITIAL_STOCK = 5;
let productId = '';
let orderFlow = { number: '', id: '' };
let orderCancel = { number: '', id: '' };

async function stockOf(id: string): Promise<number> {
  const api = await BackendApi.create();
  try {
    return (await (await api.login()).getProduct(id)).stock;
  } finally {
    await api.dispose();
  }
}

/** Cambia el estado desde la UI (botón → modal con nota → Confirmar). */
async function changeStatus(page: Page, button: string, target: string, note?: string) {
  const action = page.getByRole('button', { name: button });
  await hydrated(action);
  await action.click();
  const dialog = page.getByRole('dialog', { name: `Cambiar a “${target}”` });
  await expect(dialog).toBeVisible();
  if (note) {
    const field = dialog.getByLabel('Nota (opcional)');
    await expect(field).toBeFocused();
    // Escritura tecla a tecla: detecta pérdidas de foco/caracteres al re-renderizar el modal.
    await field.pressSequentially(note);
    await expect(field).toHaveValue(note);
  }
  await dialog.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText(`Pedido marcado como ${target.toLowerCase()}.`)).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('main').getByText(target, { exact: true }).first()).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test.describe('Pedidos y clientes', () => {
  test.beforeAll(async () => {
    const api = await BackendApi.create();
    try {
      await api.login();
      const product = await api.createProduct({ name: `E2E Producto Pedido ${RUN_ID}`, sku: `E2E-PED-${RUN_ID}`.toUpperCase(), price: 10000, stock: INITIAL_STOCK });
      productId = product.id;
      const a = await api.createOrder([{ productId, quantity: 2 }]);
      const b = await api.createOrder([{ productId, quantity: 1 }]);
      orderFlow = { number: a.number, id: (await api.findOrderByNumber(a.number)).id };
      orderCancel = { number: b.number, id: (await api.findOrderByNumber(b.number)).id };
      // Crear un pedido no reserva stock.
      expect((await api.getProduct(productId)).stock).toBe(INITIAL_STOCK);
    } finally {
      await api.dispose();
    }
  });

  test.afterAll(async () => {
    const api = await BackendApi.create();
    try {
      await api.login();
      await api.cancelOpenE2EOrders();
      if (productId) await api.trySend('DELETE', `admin/products/${productId}`);
    } finally {
      await api.dispose();
    }
  });

  test('listado: búsqueda y filtro por estado', async ({ page }) => {
    await page.goto('/admin/pedidos');
    await page.getByRole('searchbox', { name: 'Buscar' }).fill(orderFlow.number);
    await expect(page).toHaveURL(new RegExp(`q=${orderFlow.number}`));
    const row = page.getByRole('row').filter({ hasText: `#${orderFlow.number}` });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(E2E_CUSTOMER);
    await expect(row).toContainText('Nuevo');
    await page.getByLabel('Filtrar por estado').selectOption('entregado');
    await expect(page).toHaveURL(/estado=entregado/);
    await expect(page.getByText('No hay pedidos')).toBeVisible();
    await page.getByLabel('Filtrar por estado').selectOption('nuevo');
    await row.getByRole('link', { name: `#${orderFlow.number}` }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/pedidos/${orderFlow.id}$`));
  });

  test('flujo nuevo → confirmado → enviado → entregado (descuenta stock al confirmar)', async ({ page }) => {
    await page.goto(`/admin/pedidos/${orderFlow.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Pedido #${orderFlow.number}`);
    await expect(page.getByText('aún no descontado (se descuenta al confirmar)', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Escribir al cliente' })).toHaveAttribute('href', new RegExp(`wa\\.me/57${E2E_PHONE}`));

    await changeStatus(page, 'Marcar como confirmado', 'Confirmado', 'E2E confirmado por pruebas');
    await expect(page.getByText('descontado del stock.', { exact: false })).toBeVisible();
    expect(await stockOf(productId)).toBe(INITIAL_STOCK - 2);
    await expect(page.getByText('E2E confirmado por pruebas')).toBeVisible();

    await changeStatus(page, 'Marcar como enviado', 'Enviado', 'Guía E2E 123456');
    await changeStatus(page, 'Marcar como entregado', 'Entregado');
    await expect(page.getByText('Este pedido está en un estado final.')).toBeVisible();
    expect(await stockOf(productId)).toBe(INITIAL_STOCK - 2);

    // Historial con todas las transiciones y nota interna.
    await expect(page.getByText('Nuevo → Confirmado')).toBeVisible();
    await expect(page.getByText('Confirmado → Enviado')).toBeVisible();
    await expect(page.getByText('Enviado → Entregado')).toBeVisible();
    await page.getByLabel('Agregar nota interna').fill('Nota interna E2E');
    await page.getByRole('button', { name: 'Guardar nota' }).click();
    await expect(page.getByText('Nota agregada.')).toBeVisible();
    await expect(page.getByText('Nota interna E2E')).toBeVisible();

    // Vista imprimible.
    await page.goto(`/admin/pedidos/${orderFlow.id}/imprimir`);
    await expect(page.getByText(orderFlow.number).first()).toBeVisible();
    await expect(page.getByText(`E2E Producto Pedido ${RUN_ID}`).first()).toBeVisible();
  });

  test('cancelar un pedido confirmado repone el stock', async ({ page }) => {
    const before = await stockOf(productId);
    await page.goto(`/admin/pedidos/${orderCancel.id}`);
    await changeStatus(page, 'Marcar como confirmado', 'Confirmado');
    expect(await stockOf(productId)).toBe(before - 1);
    await changeStatus(page, 'Cancelar pedido', 'Cancelado', 'Cancelado por pruebas E2E');
    await expect(page.getByText('Este pedido está en un estado final.')).toBeVisible();
    expect(await stockOf(productId)).toBe(before);
    // El seguimiento público refleja el estado (sin notas internas).
    const res = await page.request.post('/api/bff/store/orders/track', { data: { number: orderCancel.number, phone: E2E_PHONE } });
    expect(res.status()).toBe(200);
    const tracking = (await res.json()) as { status: string; timeline: Array<{ status: string }> };
    expect(tracking.status).toBe('cancelado');
    expect(JSON.stringify(tracking)).not.toContain('Cancelado por pruebas E2E');
  });

  test('clientes: el cliente de prueba aparece agrupado por teléfono', async ({ page }) => {
    await page.goto('/admin/clientes');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Clientes');
    await page.getByRole('searchbox', { name: 'Buscar' }).fill(E2E_PHONE);
    const row = page.getByRole('row').filter({ hasText: E2E_CUSTOMER });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('link', { name: new RegExp(E2E_PHONE) })).toHaveAttribute('href', new RegExp(`wa\\.me/57${E2E_PHONE}`));
    await row.locator('a[href^="/admin/pedidos"]').click(); // número de pedidos del cliente
    await expect(page).toHaveURL(new RegExp(`/admin/pedidos\\?q=${E2E_PHONE}`));
    await expect(page.getByRole('row').filter({ hasText: `#${orderFlow.number}` })).toBeVisible();
  });
});
