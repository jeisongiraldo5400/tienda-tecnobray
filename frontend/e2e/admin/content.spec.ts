import type { Locator, Page } from '@playwright/test';
import { BackendApi } from '../support/api';
import { RUN_ID } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';
import { pngFile } from '../support/images';

const CAT = `E2E Categoría ${RUN_ID}`;
const SUBCAT = `E2E Subcategoría ${RUN_ID}`;
const BRAND = `E2E Marca ${RUN_ID}`;
const BANNER_A = `E2E Banner A ${RUN_ID}`;
const BANNER_B = `E2E Banner B ${RUN_ID}`;

/** Limpia solo lo creado por este archivo en esta corrida (por si una prueba falla a mitad). */
test.afterAll(async () => {
  const api = await BackendApi.create();
  try {
    await api.login();
    const mine = (name: string) => name.startsWith('E2E ') && name.includes(RUN_ID);
    const cats = await api.get<Array<{ id: string; name: string; parentId: string | null }>>('admin/categories');
    for (const c of cats.filter((x) => mine(x.name)).sort((x, y) => Number(!!y.parentId) - Number(!!x.parentId))) {
      await api.trySend('DELETE', `admin/categories/${c.id}`);
    }
    for (const b of (await api.get<Array<{ id: string; name: string }>>('admin/brands')).filter((x) => mine(x.name))) {
      await api.trySend('DELETE', `admin/brands/${b.id}`);
    }
    for (const b of (await api.get<Array<{ id: string; title: string }>>('admin/banners')).filter((x) => mine(x.title))) {
      await api.trySend('DELETE', `admin/banners/${b.id}`);
    }
  } finally {
    await api.dispose();
  }
});

async function openCreate(page: Page, button: string, dialogTitle: string): Promise<Locator> {
  const btn = page.getByRole('button', { name: button });
  await hydrated(btn);
  await btn.click();
  const dialog = page.getByRole('dialog', { name: dialogTitle });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function confirmDelete(page: Page, rowOrItem: Locator, label: string, title: string) {
  await rowOrItem.getByRole('button', { name: `Eliminar ${label}` }).click();
  await page.getByRole('dialog', { name: title }).getByRole('button', { name: 'Eliminar' }).click();
}

function imageLoaded(img: Locator) {
  return expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
}

test.describe('Categorías', () => {
  test('crear con imagen, crear subcategoría, editar y eliminar', async ({ page, issues }) => {
    // Borrar una categoría con subcategorías responde 409 a propósito.
    issues.allow(/http 409: DELETE .*\/admin\/categories\//, /Failed to load resource.*409/);
    await page.goto('/admin/categorias');
    let dialog = await openCreate(page, 'Nueva categoría', 'Nueva categoría');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialog.getByText(/obligatori|Mínimo/)).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill(CAT);
    await dialog.getByLabel('Descripción').fill('Categoría creada por pruebas E2E');
    await dialog.getByLabel('Orden').fill('99');
    await dialog.locator('input[type="file"]').setInputFiles(pngFile('e2e-cat', [124, 58, 237]));
    await expect(dialog.getByRole('img', { name: 'Vista previa' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Categoría creada.')).toBeVisible();
    await expect(dialog).toBeHidden();
    const row = page.getByRole('row').filter({ hasText: CAT });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Activa');
    await imageLoaded(row.locator('img'));

    dialog = await openCreate(page, 'Nueva categoría', 'Nueva categoría');
    await dialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill(SUBCAT);
    await dialog.getByLabel('Categoría padre').selectOption({ label: CAT });
    await dialog.getByLabel('Orden').fill('1');
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Categoría creada.')).toBeVisible();
    const subRow = page.getByRole('row').filter({ hasText: SUBCAT });
    await expect(subRow).toContainText(`↳ ${SUBCAT}`);

    // La categoría nueva es visible en la tienda (revalidación por webhook).
    const api = await BackendApi.create();
    const slug = (await (await api.login()).get<Array<{ name: string; slug: string }>>('admin/categories')).find((c) => c.name === CAT)!.slug;
    await api.dispose();
    await expect(async () => {
      const res = await page.request.get(`/categoria/${slug}`);
      expect(await res.text()).toContain(SUBCAT);
    }).toPass({ timeout: 20_000 });

    // Editar: desactivar y renombrar.
    await row.getByRole('button', { name: `Editar ${CAT}` }).click();
    dialog = page.getByRole('dialog', { name: 'Editar categoría' });
    await expect(dialog.getByLabel('Categoría padre')).toBeDisabled(); // tiene subcategorías
    await dialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill(`${CAT} editada`);
    await dialog.getByRole('switch', { name: 'Activa' }).click();
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Categoría actualizada.')).toBeVisible();
    const edited = page.getByRole('row').filter({ hasText: `${CAT} editada` });
    await expect(edited).toContainText('Inactiva');

    // No se puede eliminar una categoría con subcategorías.
    await confirmDelete(page, edited, `${CAT} editada`, `¿Eliminar “${CAT} editada”?`);
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible();
    await expect(edited).toBeVisible();

    await confirmDelete(page, subRow, SUBCAT, `¿Eliminar “${SUBCAT}”?`);
    await expect(page.getByText('Categoría eliminada.').first()).toBeVisible();
    await expect(subRow).toHaveCount(0);
    await confirmDelete(page, edited, `${CAT} editada`, `¿Eliminar “${CAT} editada”?`);
    await expect(edited).toHaveCount(0);
  });
});

test.describe('Marcas', () => {
  test('crear con logo, quitar logo, desactivar y eliminar', async ({ page }) => {
    await page.goto('/admin/marcas');
    let dialog = await openCreate(page, 'Nueva marca', 'Nueva marca');
    await dialog.getByRole('textbox', { name: 'Nombre', exact: true }).fill(BRAND);
    await dialog.locator('input[type="file"]').setInputFiles(pngFile('e2e-brand', [234, 88, 12], [120, 40]));
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Marca creada.')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: BRAND });
    await expect(row).toContainText('Activa');
    await expect(row).toContainText(`/e2e-marca-${RUN_ID}`);
    await imageLoaded(row.locator('img'));

    await row.getByRole('button', { name: `Editar ${BRAND}` }).click();
    dialog = page.getByRole('dialog', { name: 'Editar marca' });
    await imageLoaded(dialog.getByRole('img', { name: 'Logo' }));
    await dialog.getByRole('button', { name: 'Quitar' }).click();
    await page.getByRole('dialog', { name: '¿Quitar el logo de la marca?' }).getByRole('button', { name: 'Quitar' }).click();
    await expect(page.getByText('Logo eliminado.')).toBeVisible();
    await expect(dialog.getByText('Seleccionar imagen')).toBeVisible();
    await dialog.getByRole('switch', { name: 'Activa' }).click();
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Marca actualizada.')).toBeVisible();
    await expect(row).toContainText('Inactiva');
    await expect(row.locator('img')).toHaveCount(0); // sin logo: marcador de posición

    await confirmDelete(page, row, BRAND, `¿Eliminar la marca “${BRAND}”?`);
    await expect(page.getByText('Marca eliminada.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});

test.describe('Banners', () => {
  test('crear (imagen obligatoria), editar, reordenar entre banners de prueba y eliminar', async ({ page }) => {
    await page.goto('/admin/banners');
    const items = page.getByRole('main').getByRole('listitem');

    for (const [title, order] of [
      [BANNER_A, '998'],
      [BANNER_B, '999'],
    ] as const) {
      const dialog = await openCreate(page, 'Nuevo banner', 'Nuevo banner');
      await dialog.getByLabel('Título').fill(title);
      await dialog.getByRole('button', { name: 'Guardar' }).click();
      await expect(dialog.getByText('Selecciona una imagen para el banner.')).toBeVisible();
      await dialog.locator('input[type="file"]').setInputFiles(pngFile(`e2e-banner-${order}`, [15, 98, 254], [384, 144]));
      await dialog.getByLabel('Texto', { exact: true }).fill('Banner de pruebas E2E');
      await dialog.getByLabel('Enlace').fill('/productos');
      await dialog.getByLabel('Texto del botón').fill('Ver');
      await dialog.getByLabel('Orden').fill(order);
      // Inactivo: no debe aparecer en la tienda mientras corren otras pruebas.
      await dialog.getByRole('switch', { name: 'Activo' }).click();
      await dialog.getByRole('button', { name: 'Guardar' }).click();
      await expect(page.getByText('Banner creado.').first()).toBeVisible();
      await expect(dialog).toBeHidden();
    }
    const a = items.filter({ hasText: BANNER_A });
    const b = items.filter({ hasText: BANNER_B });
    await expect(a).toContainText('Inactivo');
    await imageLoaded(a.getByRole('img'));
    const titles = async () => (await items.allInnerTexts()).map((t) => (t.includes(BANNER_A) ? 'A' : t.includes(BANNER_B) ? 'B' : '-')).filter((x) => x !== '-');
    await expect.poll(titles).toEqual(['A', 'B']);

    // Reordenar solo entre los dos banners de prueba (los demo no se modifican).
    await b.getByRole('button', { name: 'Subir' }).click();
    await expect.poll(titles).toEqual(['B', 'A']);

    // Editar el título.
    await a.getByRole('button', { name: `Editar ${BANNER_A}` }).click();
    const edit = page.getByRole('dialog', { name: 'Editar banner' });
    await edit.getByLabel('Título').fill(`${BANNER_A} editado`);
    await edit.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Banner actualizado.')).toBeVisible();
    const aEdited = items.filter({ hasText: `${BANNER_A} editado` });
    await expect(aEdited).toBeVisible();

    // El inicio público no muestra banners inactivos.
    const home = await page.request.get('/');
    expect(await home.text()).not.toContain(BANNER_A);

    await confirmDelete(page, aEdited, `${BANNER_A} editado`, `¿Eliminar el banner “${BANNER_A} editado”?`);
    await expect(aEdited).toHaveCount(0);
    await confirmDelete(page, b, BANNER_B, `¿Eliminar el banner “${BANNER_B}”?`);
    await expect(b).toHaveCount(0);
  });
});
