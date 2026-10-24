import { defineConfig, devices } from '@playwright/test';
import { E2E } from './e2e/support/env';

/**
 * Pruebas E2E (Playwright) contra la tienda y el panel corriendo en local.
 * Requiere el backend en :4001 y el frontend en :3002 (si el frontend no está arriba, se inicia con `pnpm dev`).
 * Ver e2e/README en frontend/README.md → "Pruebas E2E".
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // BD de desarrollo compartida: una sola ejecución a la vez evita carreras entre la tienda y el panel
  // (p. ej. un producto E2E apareciendo en un listado que otra prueba compara). E2E_WORKERS lo sobrescribe.
  workers: Number(process.env.E2E_WORKERS) || 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: E2E.baseURL,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 45_000,
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Tienda en tres tamaños (mobile first): móvil ~390 px, tablet 768 px y escritorio.
    { name: 'mobile', testMatch: /storefront\/.*\.spec\.ts/, use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    {
      name: 'tablet',
      testMatch: /storefront\/.*\.spec\.ts/,
      use: { ...devices['Galaxy Tab S4'], viewport: { width: 768, height: 1024 } },
    },
    { name: 'desktop', testMatch: /storefront\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'a11y', testMatch: /a11y\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    {
      name: 'admin',
      testMatch: /admin\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: E2E.adminStorageState },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: E2E.baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
