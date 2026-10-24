import { BackendApi } from './support/api';

/**
 * Red de seguridad: aunque cada archivo limpia lo suyo en afterAll, aquí se eliminan los restos con
 * prefijo "E2E " (productos, categorías, marcas, banners, usuarios) y se cancelan los pedidos abiertos
 * del cliente "E2E Prueba". Nunca toca datos demo.
 */
export default async function globalTeardown() {
  const api = await BackendApi.create();
  try {
    await api.login();
    const removed = await api.sweepE2EData();
    const leftovers = Object.entries(removed).filter(([, n]) => n > 0);
    if (leftovers.length > 0) console.log(`[e2e teardown] limpieza adicional: ${leftovers.map(([k, n]) => `${k}=${n}`).join(', ')}`);
  } catch (e) {
    console.warn(`[e2e teardown] no se pudo completar la limpieza: ${(e as Error).message}`);
  } finally {
    await api.dispose();
  }
}
