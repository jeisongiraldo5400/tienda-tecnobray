import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/**
 * Fixture automática: registra errores de consola, excepciones no capturadas, solicitudes fallidas
 * y respuestas HTTP >= 400 del propio sitio en cada prueba, y falla si aparece alguno inesperado.
 * Las pruebas que provocan errores a propósito (404, credenciales inválidas…) los declaran con
 * `issues.allow(/patrón/)`.
 */
export interface PageIssues {
  allow: (...patterns: RegExp[]) => void;
  list: () => string[];
}

const ALWAYS_IGNORED: RegExp[] = [
  /net::ERR_ABORTED/, // navegaciones/prefetch cancelados al cambiar de página
  /_next\/webpack-hmr|turbopack-hmr|__nextjs_original-stack-frame/, // herramientas de desarrollo
  /Download the React DevTools/,
  /\[Fast Refresh\]|\[HMR\]/,
];

function attachMonitors(page: Page, issues: string[], perf: string[]) {
  const origin = new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3002').origin;
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') issues.push(`console.error: ${text}`);
    // next/image avisa por consola de problemas reales de maquetación (p. ej. `fill` sin padre posicionado):
    // fallan la prueba. El aviso de LCP es una heurística de desarrollo (y da falsos positivos cuando la
    // misma imagen aparece eager y lazy, como el logo en header y footer): se registra como anotación.
    if (msg.type() === 'warning' && /^Image with src/.test(text)) {
      if (/Largest Contentful Paint/.test(text)) perf.push(`${new URL(page.url()).pathname}: ${text.split('\n')[0]}`);
      else issues.push(`console.warning: ${text}`);
    }
  });
  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => issues.push(`requestfailed: ${req.method()} ${req.url()} (${req.failure()?.errorText})`));
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 400 && (url.startsWith(origin) || /\/api\/media\//.test(url))) {
      issues.push(`http ${res.status()}: ${res.request().method()} ${url}`);
    }
  });
}

export const test = base.extend<{ issues: PageIssues }>({
  issues: [
    async ({ page }, provide, testInfo: TestInfo) => {
      const found: string[] = [];
      const perf: string[] = [];
      const allowed: RegExp[] = [...ALWAYS_IGNORED];
      attachMonitors(page, found, perf);
      page.on('popup', (popup) => attachMonitors(popup, found, perf));
      await provide({ allow: (...p) => allowed.push(...p), list: () => found.filter((i) => !allowed.some((r) => r.test(i))) });
      for (const p of new Set(perf)) testInfo.annotations.push({ type: 'perf LCP', description: p });
      const unexpected = found.filter((i) => !allowed.some((r) => r.test(i)));
      if (unexpected.length > 0) {
        await testInfo.attach('page-issues', { body: unexpected.join('\n'), contentType: 'text/plain' });
      }
      // Solo se exige si la prueba pasó: si ya falló, el motivo original es más útil.
      if (testInfo.status === testInfo.expectedStatus) {
        expect(unexpected, 'Errores de consola o de red inesperados en la página').toEqual([]);
      }
    },
    { auto: true },
  ],
});

export { expect };

/** Escaneo axe-core: devuelve solo violaciones serias/críticas (las demás se adjuntan al reporte). */
export async function axeSerious(page: Page, testInfo: TestInfo, options: { exclude?: string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  for (const sel of options.exclude ?? []) builder = builder.exclude(sel);
  const results = await builder.analyze();
  await testInfo.attach('axe-violations', {
    body: JSON.stringify(
      results.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 10) })),
      null,
      2,
    ),
    contentType: 'application/json',
  });
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const describe = (v: (typeof serious)[number]) => `${v.impact} ${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`;
  // Incluye color-contrast: la paleta de TecnoBray (marino/lima) está validada para WCAG AA.
  return serious.map(describe);
}

/** Falla si la página tiene desplazamiento horizontal (diseño mobile first). */
export async function expectNoHorizontalOverflow(page: Page, label = page.url()) {
  const { scrollWidth, innerWidth, offenders } = await page.evaluate(() => {
    const vw = window.innerWidth;
    const wide = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((el) => el.getBoundingClientRect().right > vw + 1 && getComputedStyle(el).position !== 'fixed')
      .filter((el) => !el.closest('[class*="overflow-x-auto"], [class*="overflow-hidden"], [class*="overflow-x-hidden"]'))
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 3).join('.')}`);
    return { scrollWidth: document.documentElement.scrollWidth, innerWidth: vw, offenders: wide };
  });
  expect(scrollWidth, `desbordamiento horizontal en ${label} (${offenders.join(', ')})`).toBeLessThanOrEqual(innerWidth);
}

/**
 * Espera a que React haya hidratado el elemento (tiene sus props/handlers adjuntos). Evita clics
 * "perdidos" sobre HTML del servidor aún sin interactividad, sin recurrir a esperas arbitrarias.
 */
export async function hydrated(locator: Locator): Promise<Locator> {
  await expect(locator.first()).toBeVisible();
  await expect
    .poll(() => locator.first().evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps'))), {
      message: 'el elemento no se hidrató',
    })
    .toBe(true);
  return locator;
}
