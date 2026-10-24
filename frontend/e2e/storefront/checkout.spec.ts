import type { Page } from '@playwright/test';
import { BackendApi, type StoreProductDetail } from '../support/api';
import { E2E_CUSTOMER, E2E_PHONE } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';
import { findProduct, parseCOP } from './helpers';

/** Pedidos creados en este archivo: se cancelan al terminar. */
const createdOrders: string[] = [];

async function buyNow(page: Page, slug: string) {
  await page.goto(`/producto/${slug}`);
  const buy = page.getByRole('button', { name: 'Comprar ahora' });
  await hydrated(buy);
  await buy.click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole('form', { name: 'Datos de envío' })).toBeVisible();
}

test.describe('Checkout', () => {
  let product: StoreProductDetail;
  test.beforeAll(async () => {
    // El más barato disponible: el pedido queda en "nuevo" (no descuenta stock) y se cancela al final.
    product = await findProduct((p) => p.inStock, 'pageSize=48&sort=price_asc&inStock=true');
  });

  test.afterAll(async () => {
    if (createdOrders.length === 0) return;
    const api = await BackendApi.create();
    try {
      await api.login();
      for (const number of createdOrders) {
        const order = await api.findOrderByNumber(number);
        if (order.status === 'nuevo') await api.send('PATCH', `admin/orders/${order.id}/status`, { status: 'cancelado', note: 'Limpieza E2E' });
      }
    } finally {
      await api.dispose();
    }
  });

  test('sin productos muestra el estado vacío', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.getByText('No hay productos para pagar')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver productos' })).toHaveAttribute('href', '/productos');
  });

  test('muestra errores de validación y no envía el pedido', async ({ page }) => {
    let ordersPosted = 0;
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.url().includes('/store/orders')) ordersPosted++;
    });
    await buyNow(page, product.slug);
    const submit = page.getByRole('button', { name: 'Confirmar pedido' });
    await hydrated(submit);
    await submit.click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByText('El celular es obligatorio.')).toBeVisible();
    await expect(page.getByText('La ciudad es obligatoria.')).toBeVisible();
    await expect(page.getByText('La dirección es obligatoria.')).toBeVisible();
    await expect(page.getByText('Debes aceptar los términos y la política de datos.')).toBeVisible();
    await expect(page.getByLabel('Nombre completo')).toHaveAttribute('aria-invalid', 'true');

    await page.getByLabel('Nombre completo').fill('Ab');
    await page.getByLabel('Celular').fill('12345');
    await page.getByLabel('Correo electrónico (opcional)').fill('no-es-correo');
    await page.getByLabel('Dirección').fill('Cl 1');
    await submit.click();
    await expect(page.getByText('Escribe tu nombre completo.')).toBeVisible();
    await expect(page.getByText(/Ingresa un celular colombiano válido/)).toBeVisible();
    await expect(page.getByText('Ingresa un correo válido.')).toBeVisible();
    await expect(page.getByText(/Escribe la dirección completa/)).toBeVisible();
    expect(ordersPosted).toBe(0);
    // El carrito sigue intacto.
    await expect(page.getByRole('button', { name: 'Abrir carrito (1 producto)' })).toBeAttached();
  });

  test('pedido exitoso → confirmación → seguimiento', async ({ page }) => {
    await buyNow(page, product.slug);
    const review = page.getByRole('main');
    await expect(review.getByText(product.name).first()).toBeVisible();

    await page.getByLabel('Nombre completo').fill(E2E_CUSTOMER);
    await page.getByLabel('Celular').fill(`${E2E_PHONE.slice(0, 3)} ${E2E_PHONE.slice(3, 6)} ${E2E_PHONE.slice(6)}`);
    await page.getByLabel('Ciudad').fill('Medellín');
    await page.getByLabel('Dirección').fill('Calle 10 # 20-30, pruebas E2E');
    await page.getByLabel('Notas para la entrega (opcional)').fill('Pedido de prueba automatizada (E2E)');
    await page.getByRole('checkbox', { name: /Acepto los términos/ }).check();
    const created = page.waitForResponse((r) => r.url().includes('/store/orders') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();
    const res = await created;
    expect(res.status()).toBe(201);
    const order = (await res.json()) as { number: string; total: number };
    createdOrders.push(order.number);

    await expect(page).toHaveURL(new RegExp(`/pedido/confirmacion\\?numero=${order.number}$`));
    await expect(page.getByRole('heading', { name: '¡Gracias por tu compra!' })).toBeVisible();
    await expect(page.getByText(`Pedido #${order.number}`)).toBeVisible();
    await expect(page.getByText(`1 × ${product.name}`)).toBeVisible();
    const total = page.getByRole('term').filter({ hasText: /^Total$/ }).locator('xpath=following-sibling::dd');
    expect(parseCOP((await total.textContent()) ?? '')).toBe(product.price);
    // CTA principal: "Siguiente paso: confírmalo por WhatsApp" con el resumen del pedido.
    await expect(page.getByRole('heading', { name: 'Siguiente paso: confírmalo por WhatsApp' })).toBeVisible();
    const wa = page.getByRole('link', { name: 'Enviar pedido por WhatsApp' });
    await expect(wa).toBeVisible();
    await expect(wa).toHaveAttribute('target', '_blank');
    await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+\?text=/);
    const waText = decodeURIComponent((await wa.getAttribute('href'))!);
    expect(waText).toContain(order.number);
    expect(waText).toContain('formas de pago');
    // "Rastrear mi pedido" va debajo del CTA de WhatsApp.
    const waBox = (await wa.boundingBox())!;
    const trackBox = (await page.getByRole('link', { name: 'Rastrear mi pedido' }).boundingBox())!;
    expect(trackBox.y).toBeGreaterThan(waBox.y);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    // El carrito queda vacío tras comprar.
    await expect(page.getByRole('button', { name: 'Abrir carrito (0 productos)' })).toBeAttached();

    await page.getByRole('link', { name: 'Rastrear mi pedido' }).click();
    await expect(page).toHaveURL(new RegExp(`/seguimiento\\?numero=${order.number}$`));
    await expect(page.getByLabel('Número de pedido')).toHaveValue(order.number);
    const phone = page.getByLabel('Celular');
    await hydrated(phone);
    await phone.fill(E2E_PHONE);
    await page.getByRole('button', { name: 'Consultar' }).click();
    await expect(page.getByText(`#${order.number}`, { exact: true })).toBeVisible();
    await expect(page.getByText('Nuevo').first()).toBeVisible();
    await expect(page.getByText(`1 × ${product.name}`)).toBeVisible();
  });

  test('seguimiento con datos que no coinciden muestra error claro', async ({ page, issues }) => {
    issues.allow(/http 404: POST .*\/store\/orders\/track/, /Failed to load resource.*404/);
    await page.goto('/seguimiento');
    const number = page.getByLabel('Número de pedido');
    await hydrated(number);
    await page.getByRole('button', { name: 'Consultar' }).click();
    await expect(page.getByText('Ingresa el número de pedido.')).toBeVisible();
    await expect(page.getByText('Ingresa el celular del pedido.')).toBeVisible();
    await number.fill('TB-999999');
    await page.getByLabel('Celular').fill('3000000000');
    await page.getByRole('button', { name: 'Consultar' }).click();
    await expect(page.getByText('No encontramos el pedido')).toBeVisible();
  });
});
