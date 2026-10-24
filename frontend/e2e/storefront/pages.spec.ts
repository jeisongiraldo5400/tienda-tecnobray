import { storeApi } from '../support/api';
import { expect, test } from '../support/fixtures';
import { listProducts } from './helpers';

test.describe('Páginas informativas, 404, sitemap y robots', () => {
  test('políticas: cada página del footer se renderiza con su contenido', async ({ page }) => {
    const pages = await storeApi<Array<{ slug: string; title: string }>>('store/pages');
    expect(pages.length).toBeGreaterThan(0);
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    for (const p of pages) {
      await expect(footer.getByRole('link', { name: p.title })).toHaveAttribute('href', `/politicas/${p.slug}`);
    }
    for (const p of pages) {
      await page.goto(`/politicas/${p.slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.title);
      await expect(page).toHaveTitle(new RegExp(`^${p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\|`));
      const article = page.getByRole('article');
      await expect(article).not.toBeEmpty();
      // El Markdown llega convertido a HTML (no se ven "##" ni etiquetas escapadas).
      await expect(article).not.toContainText('##');
      await expect(article).not.toContainText('<p>');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/politicas/${p.slug}$`));
    }
  });

  test('ruta inexistente → 404 con enlaces de regreso', async ({ page, issues }) => {
    issues.allow(/http 404: GET .*\/ruta-que-no-existe-e2e/, /Failed to load resource.*404/);
    const res = await page.goto('/ruta-que-no-existe-e2e');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await page.getByRole('link', { name: 'Ver productos' }).click();
    await expect(page).toHaveURL(/\/productos$/);
  });

  test('sitemap.xml incluye inicio, categorías y productos activos, y no el panel', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
    const xml = await res.text();
    const { items } = await listProducts('pageSize=5');
    for (const p of items) expect(xml).toContain(`/producto/${p.slug}</loc>`);
    const cats = await storeApi<Array<{ slug: string }>>('store/categories');
    expect(xml).toContain(`/categoria/${cats[0]!.slug}</loc>`);
    expect(xml).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/);
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/checkout');
  });

  test('robots.txt bloquea panel y checkout y referencia el sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const txt = await res.text();
    for (const path of ['/admin', '/api/', '/checkout', '/carrito']) expect(txt).toContain(`Disallow: ${path}`);
    expect(txt).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);
  });
});
