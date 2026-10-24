import type { Page } from '@playwright/test';
import type { StoreProductDetail } from '../support/api';
import { expect, hydrated, test } from '../support/fixtures';
import { findProduct, parseCOP, productCards } from './helpers';

const MAX_PER_ITEM = 10;

function cartButton(page: Page, count: number) {
  return page.getByRole('button', { name: `Abrir carrito (${count} ${count === 1 ? 'producto' : 'productos'})` });
}

async function addFromProductPage(page: Page, slug: string) {
  await page.goto(`/producto/${slug}`);
  // El panel de compra va antes que las tarjetas de relacionados (que también tienen "Agregar al carrito").
  const add = page.getByRole('button', { name: 'Agregar al carrito' }).first();
  await hydrated(add);
  await add.click();
}

test.describe('Carrito', () => {
  let product: StoreProductDetail;
  let limited: StoreProductDetail;
  test.beforeAll(async () => {
    product = await findProduct((p) => p.inStock && p.maxQuantity >= 3);
    // Producto con stock limitado para comprobar el tope por stock (no por el máximo de 10).
    limited = await findProduct((p) => p.inStock && p.maxQuantity >= 2 && p.maxQuantity < MAX_PER_ITEM);
  });

  test('agregar, actualizar cantidad, persistir tras recargar y quitar', async ({ page }) => {
    await addFromProductPage(page, product.slug);
    await expect(page.getByText('Producto agregado al carrito')).toBeVisible();
    const drawer = page.getByRole('dialog', { name: 'Tu carrito' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('link', { name: product.name }).first()).toBeVisible();
    await expect(cartButton(page, 1)).toBeAttached();

    await drawer.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await expect(drawer.getByRole('group', { name: 'Cantidad' })).toContainText('2');
    const subtotal = drawer.getByRole('definition').first();
    await expect.poll(async () => parseCOP((await subtotal.textContent()) ?? '')).toBe(product.price * 2);
    await expect(cartButton(page, 2)).toBeAttached();

    await drawer.getByRole('link', { name: 'Ver carrito' }).click();
    await expect(page).toHaveURL(/\/carrito$/);
    await expect(page.getByRole('dialog', { name: 'Tu carrito' })).toHaveCount(0);
    await page.reload();
    const row = page.getByRole('main').getByRole('listitem').filter({ hasText: product.name });
    await expect(row.getByRole('group', { name: 'Cantidad' })).toContainText('2');
    await expect(cartButton(page, 2)).toBeAttached();

    await row.getByRole('button', { name: 'Disminuir cantidad' }).click();
    await expect(row.getByRole('group', { name: 'Cantidad' })).toContainText('1');
    await expect(row.getByRole('button', { name: 'Disminuir cantidad' })).toBeDisabled();

    await row.getByRole('button', { name: `Quitar ${product.name} del carrito` }).click();
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
    await expect(cartButton(page, 0)).toBeAttached();
    await page.reload();
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('la cantidad se limita al stock disponible', async ({ page }) => {
    await page.goto(`/producto/${limited.slug}`);
    const stepper = page.getByRole('main').getByRole('group', { name: 'Cantidad' });
    const plus = stepper.getByRole('button', { name: 'Aumentar cantidad' });
    await hydrated(plus);
    for (let i = 1; i < limited.maxQuantity; i++) await plus.click();
    await expect(stepper).toContainText(String(limited.maxQuantity));
    await expect(plus).toBeDisabled();
    await page.getByRole('button', { name: 'Agregar al carrito' }).first().click();
    const drawer = page.getByRole('dialog', { name: 'Tu carrito' });
    await expect(drawer.getByRole('group', { name: 'Cantidad' })).toContainText(String(limited.maxQuantity));
    await expect(drawer.getByRole('button', { name: 'Aumentar cantidad' })).toBeDisabled();
    await drawer.getByRole('button', { name: 'Cerrar' }).click();

    // Volver a agregar desde la tarjeta del catálogo no supera el tope.
    await page.goto(`/productos?q=${encodeURIComponent(limited.name)}`);
    const card = productCards(page).filter({ hasText: limited.name }).first();
    const addCard = card.getByRole('button', { name: 'Agregar al carrito' });
    await hydrated(addCard);
    await addCard.click();
    await expect(cartButton(page, limited.maxQuantity)).toBeAttached();
  });

  test('vaciar carrito pide confirmación', async ({ page }) => {
    await addFromProductPage(page, product.slug);
    await expect(cartButton(page, 1)).toBeAttached();
    await page.goto('/carrito');
    await page.getByRole('button', { name: 'Vaciar carrito' }).click();
    const confirm = page.getByRole('dialog', { name: '¿Vaciar el carrito?' });
    await confirm.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByRole('main').getByRole('listitem').filter({ hasText: product.name })).toBeVisible();
    await page.getByRole('button', { name: 'Vaciar carrito' }).click();
    await confirm.getByRole('button', { name: 'Vaciar' }).click();
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });
});
