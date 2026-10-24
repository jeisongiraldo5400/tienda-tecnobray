import { axeSerious, expect, hydrated, test } from './support/fixtures';
import { findProduct } from './storefront/helpers';

/**
 * Accesibilidad básica (axe-core, WCAG 2.1 A/AA). La prueba falla con violaciones serias o críticas;
 * el detalle completo (incluidas las menores) queda adjunto al reporte como `axe-violations`.
 */
test.describe('Accesibilidad (axe)', () => {
  test('inicio', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Destacados' })).toBeVisible();
    expect(await axeSerious(page, testInfo)).toEqual([]);
  });

  test('detalle de producto', async ({ page }, testInfo) => {
    const product = await findProduct((p) => p.inStock && p.images.length > 1);
    await page.goto(`/producto/${product.slug}`);
    await hydrated(page.getByRole('button', { name: 'Agregar al carrito' }).first());
    expect(await axeSerious(page, testInfo)).toEqual([]);
  });

  test('checkout con productos y errores de validación visibles', async ({ page }, testInfo) => {
    const product = await findProduct((p) => p.inStock);
    await page.goto(`/producto/${product.slug}`);
    const buy = page.getByRole('button', { name: 'Comprar ahora' });
    await hydrated(buy);
    await buy.click();
    await expect(page).toHaveURL(/\/checkout$/);
    await page.getByRole('button', { name: 'Confirmar pedido' }).click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    expect(await axeSerious(page, testInfo)).toEqual([]);
  });

  test('carrito abierto (drawer)', async ({ page }, testInfo) => {
    const product = await findProduct((p) => p.inStock);
    await page.goto(`/producto/${product.slug}`);
    const add = page.getByRole('button', { name: 'Agregar al carrito' }).first();
    await hydrated(add);
    await add.click();
    await expect(page.getByRole('dialog', { name: 'Tu carrito' })).toBeVisible();
    // El aviso "Producto agregado" entra con una animación de opacidad: se mide ya visible por completo.
    await expect(page.locator('[data-sonner-toast]').first()).toHaveCSS('opacity', '1');
    expect(await axeSerious(page, testInfo)).toEqual([]);
  });

  test('login del panel', async ({ page }, testInfo) => {
    await page.goto('/admin/login');
    await hydrated(page.getByLabel('Correo'));
    expect(await axeSerious(page, testInfo)).toEqual([]);
  });
});
