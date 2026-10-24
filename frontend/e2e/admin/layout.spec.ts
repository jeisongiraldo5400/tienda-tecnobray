import { expect, expectNoHorizontalOverflow, test } from '../support/fixtures';

const VIEWPORTS = [
  { name: 'móvil', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'escritorio', width: 1280, height: 800 },
];
const PAGES = [
  '/admin',
  '/admin/pedidos',
  '/admin/productos',
  '/admin/productos/nuevo',
  '/admin/categorias',
  '/admin/marcas',
  '/admin/banners',
  '/admin/secciones',
  '/admin/clientes',
  '/admin/configuracion',
  '/admin/usuarios',
];

test.describe('Panel: sin desbordamiento horizontal', () => {
  for (const vp of VIEWPORTS) {
    test(`páginas del panel en ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const path of PAGES) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expectNoHorizontalOverflow(page, `${path} @${vp.width}`);
      }
      // En móvil y tablet el menú lateral se abre como panel.
      if (vp.width < 1024) {
        await page.getByRole('button', { name: 'Abrir menú' }).click();
        await expect(page.getByRole('navigation', { name: 'Menú del panel' })).toBeVisible();
        await expectNoHorizontalOverflow(page, `menú @${vp.width}`);
      }
    });
  }
  test('login del panel en móvil', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/admin/login');
    await expect(page.getByRole('form', { name: 'Iniciar sesión' })).toBeVisible();
    await expectNoHorizontalOverflow(page, '/admin/login @390');
    await ctx.close();
  });
});
