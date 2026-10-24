import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { E2E } from './support/env';
import { expect, hydrated, test } from './support/fixtures';

/** Inicia sesión en el panel por la UI una sola vez y guarda la sesión para las pruebas de admin. */
test('iniciar sesión como administrador', async ({ page }) => {
  await page.goto('/admin/login');
  const email = page.getByLabel('Correo');
  await hydrated(email);
  await email.fill(E2E.adminEmail);
  await page.getByLabel('Contraseña').fill(E2E.adminPassword);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { level: 1, name: /^Hola,/ })).toBeVisible();
  mkdirSync(path.dirname(E2E.adminStorageState), { recursive: true });
  await page.context().storageState({ path: E2E.adminStorageState });
});
