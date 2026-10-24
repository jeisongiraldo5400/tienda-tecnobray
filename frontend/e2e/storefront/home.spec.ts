import { storeApi } from '../support/api';
import { expect, hydrated, test } from '../support/fixtures';

interface HomeData {
  banners: Array<{ title: string; imageUrl: string | null }>;
  categories: Array<{ name: string; slug: string }>;
  featured: Array<{ name: string; slug: string }>;
  newest: Array<{ name: string }>;
  sections: Array<{ title: string; products: unknown[] }>;
}

test.describe('Inicio', () => {
  let home: HomeData;
  test.beforeAll(async () => {
    home = await storeApi<HomeData>('store/home');
  });

  test('muestra banners, categorías, destacados y secciones', async ({ page }) => {
    await page.goto('/');
    const banners = home.banners.filter((b) => b.imageUrl);

    if (banners.length > 0) {
      const carousel = page.getByRole('region', { name: 'Promociones destacadas' });
      await expect(carousel).toBeVisible();
      // Las diapositivas inactivas están ocultas a lectores de pantalla (aria-hidden).
      const slides = carousel.getByRole('group', { includeHidden: true });
      await expect(slides).toHaveCount(banners.length);
      await expect(slides.first().getByRole('heading', { name: banners[0]!.title })).toBeVisible();
      // La imagen principal del slider (LCP) no es lazy, se pide con prioridad alta y carga de verdad.
      const firstImg = slides.first().locator('img');
      await expect(firstImg).not.toHaveAttribute('loading', 'lazy');
      await expect(firstImg).toHaveAttribute('fetchpriority', 'high');
      await expect.poll(() => firstImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

      if (banners.length > 1) {
        const dot2 = carousel.getByRole('button', { name: 'Ir a la diapositiva 2' });
        await hydrated(dot2);
        await dot2.click();
        await expect(dot2).toHaveAttribute('aria-current', 'true');
        await expect(slides.nth(1)).not.toHaveAttribute('aria-hidden', 'true');
        const next = carousel.getByRole('button', { name: 'Diapositiva siguiente' });
        if (await next.isVisible()) {
          await next.click();
          await expect(carousel.getByRole('button', { name: `Ir a la diapositiva ${banners.length > 2 ? 3 : 1}` })).toHaveAttribute('aria-current', 'true');
        }
      }
    }

    const cats = page.getByRole('region', { name: 'Compra por categoría' });
    await expect(cats).toBeVisible();
    for (const c of home.categories.slice(0, 3)) {
      await expect(cats.getByRole('link', { name: c.name })).toHaveAttribute('href', `/categoria/${c.slug}`);
    }

    const featured = page.getByRole('region', { name: 'Destacados' });
    // El carrusel/rejilla puede ocultar tarjetas según el ancho: al menos una y nunca más de 8.
    await expect(featured.getByRole('article').first()).toBeVisible();
    expect(await featured.getByRole('article').count()).toBeLessThanOrEqual(Math.min(home.featured.length, 8));
    await expect(featured.getByRole('link', { name: home.featured[0]!.name }).first()).toBeVisible();

    for (const s of home.sections.filter((x) => x.products.length > 0)) {
      await expect(page.getByRole('region', { name: s.title })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Lo más nuevo' }).getByRole('article').first()).toBeVisible();
  });

  test('SEO: título, descripción, canonical, Open Graph y JSON-LD', async ({ page }) => {
    const settings = await storeApi<{ seoTitle: string; seoDescription: string; storeName: string }>('store/settings');
    await page.goto('/');
    await expect(page).toHaveTitle(settings.seoTitle || settings.storeName);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', settings.seoDescription);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /localhost:3002\/?$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_CO');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-CO');
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ld.flatMap((t) => [JSON.parse(t)].flat().map((x: { '@type': string }) => x['@type']));
    expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
    // Un solo h1 por página.
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('la búsqueda del encabezado lleva al catálogo con la consulta', async ({ page }) => {
    await page.goto('/');
    const search = page.getByRole('searchbox', { name: 'Buscar productos' }).filter({ visible: true });
    await hydrated(search);
    await search.fill('sonik');
    await search.press('Enter');
    await expect(page).toHaveURL(/\/productos\?q=sonik$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Resultados para “sonik”');
    const cards = page.getByRole('main').getByRole('article');
    await expect(cards.first()).toBeVisible();
    for (const name of await cards.getByRole('heading').allTextContents()) {
      expect(name.toLowerCase()).toContain('sonik');
    }
  });

  test('navegación: menú móvil o barra de categorías lleva a una categoría', async ({ page }) => {
    await page.goto('/');
    const target = home.categories[0]!;
    const bar = page.getByRole('navigation', { name: 'Categorías' });
    if (await bar.isVisible()) {
      await bar.getByRole('link', { name: target.name }).click();
    } else {
      const menu = page.getByRole('button', { name: 'Abrir menú' });
      await hydrated(menu);
      await menu.click();
      await page.getByRole('dialog', { name: 'Menú' }).getByRole('link', { name: target.name }).click();
    }
    await expect(page).toHaveURL(new RegExp(`/categoria/${target.slug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(target.name);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
