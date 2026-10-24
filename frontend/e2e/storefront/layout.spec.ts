import { expect, expectNoHorizontalOverflow, hydrated, test } from '../support/fixtures';
import { findProduct } from './helpers';

/** Mobile first: ninguna página principal de la tienda debe desplazarse horizontalmente (móvil, tablet y escritorio). */
test('sin desbordamiento horizontal en las páginas principales de la tienda', async ({ page }) => {
  const product = await findProduct((p) => p.inStock && p.images.length > 1);
  const pages = ['/', '/productos', '/productos?q=sonik', `/categoria/${product.category?.slug ?? 'audio'}`, `/producto/${product.slug}`, '/carrito', '/checkout', '/seguimiento', '/politicas/envios'];
  for (const path of pages) {
    await page.goto(path);
    await expect(page.getByRole('main')).toBeVisible();
    await expectNoHorizontalOverflow(page, path);
  }
  // Con el carrito abierto y con productos en el checkout.
  await page.goto(`/producto/${product.slug}`);
  const add = page.getByRole('button', { name: 'Agregar al carrito' }).first();
  await hydrated(add);
  await add.click();
  await expect(page.getByRole('dialog', { name: 'Tu carrito' })).toBeVisible();
  await expectNoHorizontalOverflow(page, 'drawer del carrito');
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: 'Confirmar pedido' })).toBeVisible();
  await expectNoHorizontalOverflow(page, '/checkout con productos');
});

/** Estabilidad visual (CLS): las tarjetas e imágenes reservan su espacio (next/image + aspect-ratio). */
test('CLS bajo en inicio, catálogo y producto', async ({ page }) => {
  const product = await findProduct((p) => p.inStock);
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const path of ['/', '/productos', `/producto/${product.slug}`]) {
    await page.goto(path, { waitUntil: 'load' });
    // Esperar a que todas las imágenes visibles terminen de cargar antes de medir.
    await page.waitForFunction(() =>
      Array.from(document.images)
        .filter((i) => i.getBoundingClientRect().top < window.innerHeight && i.loading !== 'lazy')
        .every((i) => i.complete),
    );
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    test.info().annotations.push({ type: 'CLS', description: `${path}: ${cls.toFixed(3)}` });
    expect(cls, `CLS en ${path}`).toBeLessThan(0.1);
  }
});
