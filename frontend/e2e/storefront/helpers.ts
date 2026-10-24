import type { Locator, Page } from '@playwright/test';
import { storeApi, type StoreProductCard, type StoreProductDetail } from '../support/api';
import { expect, hydrated } from '../support/fixtures';

/** Convierte "$ 1.299.900" → 1299900. */
export function parseCOP(text: string): number {
  const m = /\$\s*([\d.]+)/.exec(text);
  if (!m) throw new Error(`Sin precio en "${text}"`);
  return Number(m[1]!.replace(/\./g, ''));
}

export function productCards(page: Page): Locator {
  return page.getByRole('main').getByRole('list').getByRole('article');
}

/** Precio de venta de cada tarjeta visible (el primero que aparece en la tarjeta). */
export async function cardPrices(page: Page): Promise<number[]> {
  const texts = await productCards(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).innerText));
  return texts.map(parseCOP);
}

export async function cardNames(page: Page): Promise<string[]> {
  return productCards(page).getByRole('heading').allInnerTexts();
}

/**
 * Panel de filtros: barra lateral si está visible (escritorio) o, si no, el botón "Filtros" que abre
 * un drawer/bottom sheet (móvil y tablet). No depende del viewport sino de lo que se muestra.
 */
export async function openFilters(page: Page): Promise<Locator> {
  const aside = page.getByRole('complementary').filter({ has: page.getByRole('heading', { name: 'Filtros' }) });
  const btn = page.getByRole('button', { name: /^Filtros/ });
  // Esperar a que se muestre una de las dos variantes antes de decidir (tras navegar la página se re-renderiza).
  await expect(aside.or(btn).filter({ visible: true }).first()).toBeVisible();
  if (await aside.isVisible()) {
    await hydrated(aside.getByRole('button').first());
    return aside;
  }
  await hydrated(btn);
  await btn.click();
  const drawer = page.getByRole('dialog', { name: /Filtr/ });
  await expect(drawer).toBeVisible();
  return drawer;
}

export async function listProducts(query: string) {
  return storeApi<{ items: StoreProductCard[]; total: number; totalPages: number }>(`store/products?${query}`);
}

export async function productDetail(slug: string) {
  return storeApi<StoreProductDetail>(`store/products/${slug}`);
}

/** Primer producto que cumpla la condición (consulta el detalle de cada producto del catálogo). */
export async function findProduct(match: (p: StoreProductDetail) => boolean, query = 'pageSize=48'): Promise<StoreProductDetail> {
  const { items } = await listProducts(query);
  for (const card of items) {
    const detail = await productDetail(card.slug);
    if (match(detail)) return detail;
  }
  throw new Error('No hay un producto demo que cumpla la condición de la prueba');
}

/** Lee el JSON-LD de la página aplanado. */
export async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.flatMap((t) => [JSON.parse(t)].flat() as Array<Record<string, unknown>>);
}
