import type { Page } from '@playwright/test';
import { BackendApi } from '../support/api';
import { RUN_ID } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';
import { pngFile } from '../support/images';

const NAME = `E2E Producto ${RUN_ID}`;
const SKU = `E2E-${RUN_ID}`.toUpperCase();

let productId: string | null = null;

async function imageIds(id: string) {
  const api = await BackendApi.create();
  try {
    const p = await (await api.login()).getProduct(id);
    return p.images.map((i) => ({ id: i.id, isMain: i.isMain }));
  } finally {
    await api.dispose();
  }
}

function imagesList(page: Page) {
  return page.getByRole('list', { name: 'Imágenes del producto' }).getByRole('listitem').filter({ has: page.getByRole('img') });
}

test.describe.configure({ mode: 'serial' });

test.describe('Productos (CRUD + imágenes)', () => {
  test.afterAll(async () => {
    const api = await BackendApi.create();
    try {
      await api.login();
      if (productId) await api.trySend('DELETE', `admin/products/${productId}`);
    } finally {
      await api.dispose();
    }
  });

  test('crear producto con especificaciones e imágenes', async ({ page }) => {
    await page.goto('/admin/productos');
    await page.getByRole('link', { name: 'Nuevo producto' }).first().click();
    await expect(page).toHaveURL(/\/admin\/productos\/nuevo$/);
    const name = page.getByRole('textbox', { name: 'Nombre', exact: true });
    await hydrated(name);

    // Validación del formulario.
    await page.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page.getByText('El nombre es obligatorio.')).toBeVisible();
    await expect(page.getByText('El SKU es obligatorio.')).toBeVisible();

    await name.fill(NAME);
    await page.getByLabel('SKU').fill(SKU);
    await page.getByLabel('Descripción corta').fill('Producto creado por las pruebas E2E.');
    await page.getByLabel('Descripción completa').fill('## Detalles\n\n- Uno\n- Dos\n\n**Importante**: dato de prueba.');
    await page.getByLabel('Precio de venta (COP)').fill('150000');
    await page.getByLabel('Precio anterior (COP)').fill('120000');
    await page.getByLabel('Stock disponible').fill('7');
    await page.getByRole('button', { name: 'Crear producto' }).click();
    await expect(page.getByText('El precio anterior debe ser mayor que el precio de venta.')).toBeVisible();
    await page.getByLabel('Precio anterior (COP)').fill('180000');
    await expect(page.getByText(/antes \$\s?180\.000 \(-17%\)/)).toBeVisible();

    await page.getByRole('button', { name: 'Agregar especificación' }).click();
    await page.getByLabel('Nombre 1').fill('Color');
    await page.getByLabel('Valor 1').fill('Azul E2E');
    await page.getByRole('button', { name: 'Agregar especificación' }).click();
    await page.getByLabel('Nombre 2').fill('Peso');
    await page.getByLabel('Valor 2').fill('120 g');

    const category = page.getByLabel('Categoría');
    await expect(category).toBeEnabled();
    const firstCategory = await category.locator('option').nth(1).getAttribute('value');
    await category.selectOption(firstCategory!);

    // Imágenes en cola (se suben al crear); la primera queda como principal.
    await page.locator('input[type="file"]').setInputFiles([pngFile('e2e-rojo', [220, 38, 38]), pngFile('e2e-verde', [22, 163, 74])]);
    await expect(page.getByRole('img', { name: /Vista previa/ })).toHaveCount(2);
    await page.getByRole('button', { name: 'Quitar imagen 2' }).click();
    await expect(page.getByRole('img', { name: /Vista previa/ })).toHaveCount(1);
    await page.locator('input[type="file"]').setInputFiles([pngFile('e2e-verde', [22, 163, 74])]);
    await expect(page.getByRole('img', { name: /Vista previa/ })).toHaveCount(2);

    const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/api\/bff\/admin\/products$/.test(r.url()));
    await page.getByRole('button', { name: 'Crear producto' }).click();
    const res = await created;
    expect(res.status()).toBe(201);
    productId = ((await res.json()) as { id: string }).id;
    await expect(page.getByText('Producto creado.')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/admin/productos/${productId}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAME);
    await expect(imagesList(page)).toHaveCount(2);
    await expect(imagesList(page).first().getByText('Principal')).toBeVisible();
    // Las miniaturas se sirven desde S3 vía /api/media y cargan.
    await expect.poll(() => imagesList(page).first().getByRole('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  });

  test('subir otra imagen, reordenar y cambiar la principal', async ({ page }) => {
    test.skip(!productId, 'Requiere el producto creado');
    await page.goto(`/admin/productos/${productId}`);
    await expect(imagesList(page)).toHaveCount(2);
    const before = await imageIds(productId!);

    const uploaded = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes(`/products/${productId}/images`));
    await page.getByRole('list', { name: 'Imágenes del producto' }).locator('input[type="file"]').setInputFiles(pngFile('e2e-azul', [37, 99, 235]));
    expect((await uploaded).status()).toBe(201);
    await expect(page.getByText('Imagen subida.')).toBeVisible();
    await expect(imagesList(page)).toHaveCount(3);

    // Reordenar con las flechas: la primera pasa a segunda posición.
    await imagesList(page).first().getByRole('button', { name: 'Mover a la derecha' }).click();
    await expect.poll(async () => (await imageIds(productId!)).map((i) => i.id).slice(0, 2)).toEqual([before[1]!.id, before[0]!.id]);

    // Marcar la tercera como principal.
    const third = imagesList(page).nth(2);
    await third.getByRole('button', { name: 'Marcar como principal' }).click();
    await expect(page.getByText('Imagen principal actualizada.')).toBeVisible();
    await expect(third.getByText('Principal')).toBeVisible();
    await expect(page.getByText('Principal', { exact: true })).toHaveCount(1);
    const after = await imageIds(productId!);
    expect(after.filter((i) => i.isMain)).toHaveLength(1);

    // Texto alternativo.
    const alt = imagesList(page).first().getByRole('textbox', { name: /Texto alternativo/ });
    await alt.fill('E2E vista frontal');
    const altSaved = page.waitForResponse((r) => r.request().method() === 'PATCH' && r.url().includes('/images/'));
    await alt.blur();
    expect((await altSaved).ok()).toBe(true);

    // Eliminar una imagen.
    await imagesList(page).last().getByRole('button', { name: 'Eliminar imagen' }).click();
    await page.getByRole('dialog', { name: '¿Eliminar imagen?' }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Imagen eliminada.')).toBeVisible();
    await expect(imagesList(page)).toHaveCount(2);
  });

  test('editar, ver en la tienda, desactivar y buscar en el listado', async ({ page, context }) => {
    test.skip(!productId, 'Requiere el producto creado');
    await page.goto(`/admin/productos/${productId}`);
    const save = page.getByRole('button', { name: 'Guardar cambios' });
    await expect(save).toBeDisabled();
    await page.getByLabel('Precio de venta (COP)').fill('149900');
    await page.getByLabel('Stock disponible').fill('9');
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText('Cambios guardados.')).toBeVisible();
    await expect(save).toBeDisabled();

    // La tienda muestra el producto activo con los datos guardados (ISR revalidado por webhook).
    const [store] = await Promise.all([context.waitForEvent('page'), page.getByRole('link', { name: 'Ver en tienda' }).click()]);
    await expect(store.getByRole('heading', { level: 1 })).toHaveText(NAME);
    await expect(store.getByText(/\$\s?149\.900/).first()).toBeVisible();
    await expect(store.getByRole('table', { name: 'Especificaciones técnicas' }).getByRole('cell', { name: 'Azul E2E' })).toBeVisible();
    await expect(store.getByRole('heading', { name: 'Detalles' })).toBeVisible();
    await store.close();

    // Listado: búsqueda por SKU y switch de activo.
    await page.goto('/admin/productos');
    await page.getByRole('searchbox', { name: 'Buscar' }).fill(SKU);
    await expect(page).toHaveURL(new RegExp(`q=${SKU}`));
    const row = page.getByRole('row').filter({ hasText: NAME });
    await expect(row).toHaveCount(1);
    await expect(page.getByRole('row')).toHaveCount(2); // cabecera + 1
    await row.getByRole('switch', { name: 'Activo' }).click();
    await expect(page.getByText('Producto desactivado.')).toBeVisible();
    await expect(row.getByRole('switch', { name: 'Inactivo' })).toHaveAttribute('aria-checked', 'false');

    await page.getByLabel('Filtrar por estado').selectOption('inactivos');
    await expect(page).toHaveURL(/estado=inactivos/);
    await expect(page.getByRole('row').filter({ hasText: NAME })).toHaveCount(1);
  });

  test('eliminar producto desde el listado', async ({ page }) => {
    test.skip(!productId, 'Requiere el producto creado');
    await page.goto(`/admin/productos?q=${SKU}`);
    const row = page.getByRole('row').filter({ hasText: NAME });
    await row.getByRole('button', { name: `Eliminar ${NAME}` }).click();
    const dialog = page.getByRole('dialog', { name: `¿Eliminar “${NAME}”?` });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: `Eliminar ${NAME}` }).click();
    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Producto eliminado.')).toBeVisible();
    await expect(page.getByText('No hay productos')).toBeVisible();
    productId = null;
  });
});
