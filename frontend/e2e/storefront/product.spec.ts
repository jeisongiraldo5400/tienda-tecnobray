import type { StoreProductDetail } from '../support/api';
import { expect, hydrated, test } from '../support/fixtures';
import { findProduct, jsonLd } from './helpers';

const LOW_STOCK_THRESHOLD = 5;

test.describe('Detalle de producto', () => {
  let product: StoreProductDetail;
  test.beforeAll(async () => {
    product = await findProduct((p) => p.inStock && p.images.length > 1 && p.specs.length > 0 && p.related.length > 0);
  });

  test('galería, especificaciones, relacionados y stock', async ({ page }) => {
    await page.goto(`/producto/${product.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(product.name);
    await expect(page.getByText(`SKU: ${product.sku}`)).toBeVisible();
    if (product.category) {
      await expect(page.getByRole('navigation', { name: 'Ruta de navegación' }).getByRole('link', { name: product.category.name })).toHaveAttribute(
        'href',
        `/categoria/${product.category.slug}`,
      );
    }

    // Galería: miniaturas, cambio de imagen y visor ampliado.
    const thumbs = page.getByRole('list', { name: 'Miniaturas' }).getByRole('button');
    await expect(thumbs).toHaveCount(product.images.length);
    const main = page.getByRole('button', { name: 'Ampliar imagen' }).locator('img');
    await expect.poll(() => main.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const firstSrc = await main.getAttribute('src');
    await hydrated(thumbs.nth(1));
    await thumbs.nth(1).click();
    await expect(thumbs.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(main).not.toHaveAttribute('src', firstSrc!);
    await page.getByRole('button', { name: 'Ampliar imagen' }).click();
    const lightbox = page.getByRole('dialog', { name: product.name });
    await expect(lightbox).toBeVisible();
    await expect.poll(() => lightbox.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();

    // Especificaciones.
    const specs = page.getByRole('table', { name: 'Especificaciones técnicas' });
    await expect(specs.getByRole('row')).toHaveCount(product.specs.length);
    await expect(specs.getByRole('rowheader', { name: product.specs[0]!.key })).toBeVisible();
    await expect(specs.getByRole('cell', { name: product.specs[0]!.value })).toBeVisible();

    // Descripción renderizada como HTML (no como texto escapado).
    const desc = page.getByRole('region', { name: 'Descripción' });
    await expect(desc).toBeVisible();
    await expect(desc).not.toContainText('<p>');

    // Relacionados.
    const related = page.getByRole('region', { name: 'También te puede interesar' });
    await expect(related.getByRole('article')).toHaveCount(Math.min(product.related.length, 8));
    await expect(related.getByRole('link', { name: product.related[0]!.name }).first()).toHaveAttribute('href', `/producto/${product.related[0]!.slug}`);

    // Stock.
    const stockText = product.maxQuantity <= LOW_STOCK_THRESHOLD ? `¡Últimas ${product.maxQuantity} unidades!` : 'Disponible';
    await expect(page.getByText(stockText, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agregar al carrito' }).first()).toBeEnabled();
  });

  test('enlace de WhatsApp con el producto y la cantidad elegida', async ({ page }) => {
    await page.goto(`/producto/${product.slug}`);
    const wa = page.getByRole('link', { name: 'Comprar por WhatsApp' });
    await expect(wa).toHaveAttribute('target', '_blank');
    await expect(wa).toHaveAttribute('rel', /noopener/);
    const text = async () => decodeURIComponent(new URL((await wa.getAttribute('href'))!).searchParams.get('text') ?? '');
    expect((await wa.getAttribute('href'))!).toMatch(/^https:\/\/wa\.me\/\d{10,15}\?text=/);
    expect(await text()).toContain(product.name);
    expect(await text()).toContain(`SKU ${product.sku}`);
    expect(await text()).toContain(`/producto/${product.slug}`);
    expect(await text()).toContain('Cantidad: 1');

    const plus = page.getByRole('group', { name: 'Cantidad' }).getByRole('button', { name: 'Aumentar cantidad' });
    await hydrated(plus);
    await plus.click();
    await expect.poll(text).toContain('Cantidad: 2');
  });

  test('SEO: metadatos, canonical, Open Graph y JSON-LD de producto', async ({ page }) => {
    await page.goto(`/producto/${product.slug}`);
    await expect(page).toHaveTitle(product.seo.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', product.seo.description);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/producto/${product.slug}$`));
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /^https?:\/\//);
    const ld = await jsonLd(page);
    const p = ld.find((x) => x['@type'] === 'Product') as { name: string; sku: string; offers: { price: number | string; availability: string; priceCurrency: string } };
    expect(p.name).toBe(product.name);
    expect(p.sku).toBe(product.sku);
    expect(Number(p.offers.price)).toBe(product.price);
    expect(p.offers.priceCurrency).toBe('COP');
    expect(p.offers.availability).toContain('InStock');
    expect(ld.some((x) => x['@type'] === 'BreadcrumbList')).toBe(true);
  });

  test('producto agotado: compra deshabilitada y consulta por WhatsApp', async ({ page }) => {
    let soldOut: StoreProductDetail;
    try {
      soldOut = await findProduct((p) => !p.inStock);
    } catch {
      test.skip(true, 'No hay productos agotados en el catálogo demo');
      return;
    }
    await page.goto(`/producto/${soldOut.slug}`);
    await expect(page.getByText('Agotado', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agotado' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Comprar ahora' })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Consultar disponibilidad por WhatsApp' })).toBeVisible();
    const offer = (await jsonLd(page)).find((x) => x['@type'] === 'Product') as { offers: { availability: string } };
    expect(offer.offers.availability).toContain('OutOfStock');
  });

  test('producto inexistente muestra la página 404 sin indexar', async ({ page, issues }) => {
    issues.allow(/http 404: GET .*\/producto\/no-existe-e2e/, /Failed to load resource.*404/);
    const res = await page.goto('/producto/no-existe-e2e');
    // Sin loading.tsx de ruta: estado HTTP 404 real (no un "soft 404").
    expect(res?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  });
});
