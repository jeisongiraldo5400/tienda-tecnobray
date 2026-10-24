import { BackendApi } from '../support/api';
import { RUN_ID } from '../support/env';
import { expect, hydrated, test } from '../support/fixtures';

interface Settings {
  tagline: string;
  announcement: string;
  updatedAt: string;
}

let original: Pick<Settings, 'tagline' | 'announcement'> | null = null;

test.describe('Configuración', () => {
  test.beforeAll(async () => {
    const api = await BackendApi.create();
    try {
      const s = await (await api.login()).get<Settings>('admin/settings');
      original = { tagline: s.tagline, announcement: s.announcement };
    } finally {
      await api.dispose();
    }
  });

  // Red de seguridad: restaura los valores originales aunque la prueba falle a mitad.
  test.afterAll(async () => {
    if (!original) return;
    const api = await BackendApi.create();
    try {
      await api.login();
      const now = await api.get<Settings>('admin/settings');
      if (now.tagline !== original.tagline || now.announcement !== original.announcement) {
        await api.send('PATCH', 'admin/settings', original);
      }
    } finally {
      await api.dispose();
    }
  });

  test('validaciones del formulario', async ({ page }) => {
    await page.goto('/admin/configuracion');
    const primary = page.getByRole('textbox', { name: 'Color principal', exact: true });
    await hydrated(primary);
    await primary.fill('#12');
    await primary.blur();
    await expect(page.getByText('Color inválido (#RRGGBB).')).toBeVisible();
    const wa = page.getByLabel('WhatsApp');
    await wa.fill('123');
    await wa.blur();
    await expect(page.getByText('Escribe 10 a 15 dígitos (ej. 573001234567).')).toBeVisible();
    await page.getByLabel('Facebook').fill('http://inseguro.example');
    await page.getByLabel('Facebook').blur();
    await expect(page.getByText('Debe iniciar con https://')).toBeVisible();
    // Nada se guarda con errores: recargar descarta los cambios.
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Color principal', exact: true })).not.toHaveValue('#12');
  });

  test('editar eslogan y anuncio se refleja en la tienda y luego se restaura', async ({ page }) => {
    const tagline = `E2E eslogan ${RUN_ID}`;
    const announcement = `E2E anuncio ${RUN_ID}`;
    await page.goto('/admin/configuracion');
    const save = page.getByRole('button', { name: 'Guardar configuración' });
    await hydrated(save);
    await expect(save).toBeDisabled();
    await page.getByLabel('Eslogan').fill(tagline);
    await page.getByLabel('Barra de anuncio').fill(announcement);
    await save.click();
    await expect(page.getByText(/Configuración guardada/)).toBeVisible();
    await expect(page.getByLabel('Eslogan')).toHaveValue(tagline);

    // La tienda se revalida por webhook: el anuncio aparece en la barra superior.
    await expect(async () => {
      await page.goto('/');
      // El anuncio tiene versión corta (móvil) y completa (sm+): basta con que contenga el texto.
      await expect(page.getByRole('region', { name: 'Anuncio' })).toContainText(announcement, { timeout: 2_000 });
    }).toPass({ timeout: 30_000 });

    // Restaurar desde la UI.
    await page.goto('/admin/configuracion');
    await hydrated(page.getByRole('button', { name: 'Guardar configuración' }));
    await page.getByLabel('Eslogan').fill(original!.tagline);
    await page.getByLabel('Barra de anuncio').fill(original!.announcement);
    await page.getByRole('button', { name: 'Guardar configuración' }).click();
    await expect(page.getByText(/Configuración guardada/)).toBeVisible();
    const api = await BackendApi.create();
    const now = await (await api.login()).get<Settings>('admin/settings');
    await api.dispose();
    expect({ tagline: now.tagline, announcement: now.announcement }).toEqual(original);
  });

  test('páginas de políticas: listado y editor (sin guardar)', async ({ page }) => {
    await page.goto('/admin/configuracion');
    const tab = page.getByRole('tab', { name: 'Páginas de políticas' });
    await hydrated(tab);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    const nav = page.getByRole('navigation', { name: 'Páginas de políticas' });
    await expect(nav.getByRole('button').or(nav.getByRole('link')).first()).toBeVisible();
    await expect(page.getByLabel('Contenido')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: /Guardar/ })).toBeDisabled();
  });
});
