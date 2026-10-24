import { storeApi } from '../support/api';
import { expect, hydrated, test } from '../support/fixtures';
import { cardNames, cardPrices, listProducts, openFilters, productCards } from './helpers';

const PAGE_SIZE = 12;

test.describe('Catálogo', () => {
  test('lista todos los productos con paginación sincronizada con la URL', async ({ page }) => {
    const all = await listProducts(`pageSize=${PAGE_SIZE}`);
    await page.goto('/productos');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Todos los productos');
    await expect(page.getByText(`${all.total} productos`, { exact: true })).toBeVisible();
    await expect(productCards(page)).toHaveCount(Math.min(PAGE_SIZE, all.total));
    const firstPage = await cardNames(page);
    expect(firstPage).toEqual(all.items.map((p) => p.name));

    test.skip(all.totalPages < 2, 'Se necesita más de una página de productos');
    const pager = page.getByRole('navigation', { name: 'Paginación' });
    await expect(pager.getByRole('link', { name: '1' })).toHaveAttribute('aria-current', 'page');
    await pager.getByRole('link', { name: '2', exact: true }).click();
    await expect(page).toHaveURL(/\/productos\?pagina=2$/);
    await expect(pager.getByRole('link', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page');
    const page2 = await listProducts(`pageSize=${PAGE_SIZE}&page=2`);
    await expect.poll(() => cardNames(page)).toEqual(page2.items.map((p) => p.name));
    // Página anterior vuelve a la primera (sin ?pagina=1 en la URL).
    await pager.getByRole('link', { name: 'Página anterior' }).click();
    await expect(page).toHaveURL(/\/productos$/);
    // La página 2 no se indexa.
    await page.goto('/productos?pagina=2');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });

  test('filtra por categoría, marca y precio; los chips y "Limpiar" quitan filtros', async ({ page }) => {
    const filters = await storeApi<{ categories: Array<{ name: string; slug: string }>; brands: Array<{ name: string; slug: string }> }>(
      'store/filters',
    );
    const audio = filters.categories.find((c) => c.slug === 'audio') ?? filters.categories[0]!;
    const inCategory = await listProducts(`category=${audio.slug}&pageSize=48`);
    const brandSlug = inCategory.items.find((p) => p.brand)!.brand!.slug;
    const brand = filters.brands.find((b) => b.slug === brandSlug)!;

    await page.goto('/productos');
    let panel = await openFilters(page);
    await panel.getByRole('button', { name: new RegExp(`^${audio.name}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/productos\\?categoria=${audio.slug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(audio.name);
    await expect(page.getByText(`${inCategory.total} ${inCategory.total === 1 ? 'producto' : 'productos'}`, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `Quitar filtro ${audio.name}` })).toBeVisible();

    panel = await openFilters(page);
    await panel.getByRole('button', { name: brand.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`categoria=${audio.slug}&marca=${brand.slug}$`));
    const both = await listProducts(`category=${audio.slug}&brand=${brand.slug}&pageSize=48`);
    await expect.poll(() => cardNames(page)).toEqual(both.items.map((p) => p.name));

    // Precio: rango que deja fuera al menos un producto de la categoría.
    const prices = inCategory.items.map((p) => p.price).sort((a, b) => a - b);
    const min = prices[1]!;
    const max = prices[prices.length - 2]!;
    await page.getByRole('button', { name: `Quitar filtro ${brand.name}` }).click();
    await expect(page).toHaveURL(new RegExp(`/productos\\?categoria=${audio.slug}$`));
    panel = await openFilters(page);
    await panel.getByLabel('Desde').fill(String(min));
    await panel.getByLabel('Hasta').fill(String(max));
    await panel.getByRole('button', { name: 'Aplicar precio' }).click();
    await expect(page).toHaveURL(new RegExp(`categoria=${audio.slug}&min=${min}&max=${max}$`));
    await expect.poll(async () => (await cardPrices(page)).every((p) => p >= min && p <= max)).toBe(true);
    await expect(productCards(page)).toHaveCount(inCategory.items.filter((p) => p.price >= min && p.price <= max).length);

    panel = await openFilters(page);
    await panel.getByRole('button', { name: 'Limpiar' }).click();
    await expect(page).toHaveURL(/\/productos$/);
    await expect(page.getByRole('list', { name: 'Filtros activos' })).toHaveCount(0);
  });

  test('ordena por precio y nombre', async ({ page }) => {
    await page.goto('/productos');
    const sort = page.getByRole('combobox', { name: 'Ordenar productos' });
    await hydrated(sort);
    await sort.selectOption('price_asc');
    await expect(page).toHaveURL(/orden=price_asc/);
    await expect.poll(async () => {
      const p = await cardPrices(page);
      return p.length > 1 && p.every((v, i) => i === 0 || p[i - 1]! <= v);
    }).toBe(true);

    await sort.selectOption('price_desc');
    await expect(page).toHaveURL(/orden=price_desc/);
    await expect.poll(async () => {
      const p = await cardPrices(page);
      return p.length > 1 && p.every((v, i) => i === 0 || p[i - 1]! >= v);
    }).toBe(true);

    await sort.selectOption('name');
    await expect(page).toHaveURL(/orden=name/);
    const expected = (await listProducts(`sort=name&pageSize=${PAGE_SIZE}`)).items.map((p) => p.name);
    await expect.poll(() => cardNames(page)).toEqual(expected);
  });

  test('restaura filtros y orden desde la URL al cargar', async ({ page }) => {
    const { items } = await listProducts('pageSize=48');
    const brand = items.find((p) => p.brand)!.brand!;
    await page.goto(`/productos?marca=${brand.slug}&orden=price_desc`);
    await expect(page.getByRole('combobox', { name: 'Ordenar productos' })).toHaveValue('price_desc');
    await expect(page.getByRole('button', { name: `Quitar filtro ${brand.name}` })).toBeVisible();
    const panel = await openFilters(page);
    await expect(panel.getByRole('button', { name: brand.name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    const expected = (await listProducts(`brand=${brand.slug}&sort=price_desc&pageSize=${PAGE_SIZE}`)).items.map((p) => p.name);
    expect(await cardNames(page)).toEqual(expected);
  });

  test('búsqueda sin resultados muestra el estado vacío', async ({ page }) => {
    await page.goto('/productos?q=zzz-no-existe-e2e');
    await expect(page.getByText('No encontramos productos')).toBeVisible();
    await expect(page.getByText('0 productos', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Ver todos los productos' }).click();
    await expect(page).toHaveURL(/\/productos$/);
    await expect(productCards(page).first()).toBeVisible();
  });
});

test.describe('Página de categoría', () => {
  test('muestra solo productos de la categoría (incluye subcategorías) y navega a una subcategoría', async ({ page }) => {
    const tree = await storeApi<Array<{ name: string; slug: string; description: string | null; children: Array<{ name: string; slug: string }> }>>(
      'store/categories',
    );
    const parent = tree.find((c) => c.children.length > 0)!;
    const child = parent.children[0]!;
    const expected = await listProducts(`category=${parent.slug}&pageSize=${PAGE_SIZE}`);

    await page.goto(`/categoria/${parent.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(parent.name);
    await expect(page).toHaveTitle(new RegExp(`^${parent.name} \\|`));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/categoria/${parent.slug}$`));
    const crumbs = page.getByRole('navigation', { name: 'Ruta de navegación' });
    await expect(crumbs.getByRole('link', { name: 'Productos' })).toHaveAttribute('href', '/productos');
    await expect(crumbs.getByText(parent.name)).toHaveAttribute('aria-current', 'page');
    expect(await cardNames(page)).toEqual(expected.items.map((p) => p.name));
    // La categoría de la ruta no aparece como chip removible.
    await expect(page.getByRole('button', { name: `Quitar filtro ${parent.name}` })).toHaveCount(0);

    const panel = await openFilters(page);
    await panel.getByRole('button', { name: new RegExp(`^${child.name}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/categoria/${child.slug}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(child.name);
    const sub = await listProducts(`category=${child.slug}&pageSize=${PAGE_SIZE}`);
    await expect.poll(() => cardNames(page)).toEqual(sub.items.map((p) => p.name));
  });

  test('categoría inexistente muestra la página 404 sin indexar', async ({ page, issues }) => {
    issues.allow(/http 404: GET .*\/categoria\/no-existe-e2e/, /Failed to load resource.*404/);
    const res = await page.goto('/categoria/no-existe-e2e');
    // Sin loading.tsx de ruta: estado HTTP 404 real (no un "soft 404") y además noindex.
    expect(res?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
  });
});
