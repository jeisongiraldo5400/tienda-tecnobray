import type { Page } from '@playwright/test';
import { expect, hydrated, test } from '../support/fixtures';
import { findProduct } from './helpers';

const FLOAT = 'a[aria-label="Escríbenos por WhatsApp"]';

/**
 * Controles interactivos visibles cuyo centro queda tapado por el botón flotante de WhatsApp.
 * Se evalúa al final de la página (scroll máximo), donde el usuario ya no puede desplazarse para descubrirlos.
 */
async function controlsCoveredAtPageEnd(page: Page): Promise<string[]> {
  // `instant`: el sitio usa scroll-behavior: smooth.
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForFunction(() => Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1);
  return page.evaluate((floatSel) => {
    const float = document.querySelector(floatSel);
    if (!float) return [];
    const f = float.getBoundingClientRect();
    const controls = Array.from(document.querySelectorAll<HTMLElement>('main a, main button, main input, main select, footer a, footer button'));
    return controls
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > window.innerHeight) return false;
        const overlaps = r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top;
        if (!overlaps) return false;
        const hit = document.elementFromPoint(Math.min(r.left + r.width / 2, window.innerWidth - 1), r.top + r.height / 2);
        return !!hit && float.contains(hit);
      })
      .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`);
  }, FLOAT);
}

test.describe('Botón flotante de WhatsApp', () => {
  test('es visible, abre WhatsApp y no tapa controles al final de las páginas', async ({ page }) => {
    await page.goto('/');
    const float = page.locator(FLOAT);
    await expect(float).toBeVisible();
    await expect(float).toHaveAttribute('href', /^https:\/\/wa\.me\/\d+\?text=/);
    await expect(float).toHaveAttribute('target', '_blank');

    const product = await findProduct((p) => p.inStock);
    for (const path of ['/', '/productos', '/productos?pagina=2', `/producto/${product.slug}`, '/carrito', '/seguimiento', '/politicas/envios']) {
      await page.goto(path);
      await expect(page.getByRole('contentinfo')).toBeVisible();
      expect(await controlsCoveredAtPageEnd(page), `controles tapados en ${path}`).toEqual([]);
    }
  });

  test('no estorba en el carrito ni en el checkout', async ({ page }) => {
    const product = await findProduct((p) => p.inStock);
    await page.goto(`/producto/${product.slug}`);
    const add = page.getByRole('button', { name: 'Agregar al carrito' }).first();
    await hydrated(add);
    await add.click();
    // Con el drawer abierto, sus botones quedan por encima del flotante.
    const drawer = page.getByRole('dialog', { name: 'Tu carrito' });
    const checkout = drawer.getByRole('link', { name: 'Finalizar compra' });
    await expect(checkout).toBeVisible();
    await checkout.click({ trial: true }); // falla si otro elemento intercepta el clic
    await checkout.click();
    await expect(page).toHaveURL(/\/checkout$/);
    // En el checkout no se muestra: el foco es completar el pedido y no debe tapar "Confirmar pedido".
    await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeVisible();
    await expect(page.locator(FLOAT)).toHaveCount(0);
  });
});
