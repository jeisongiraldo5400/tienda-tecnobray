import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_CONFIG } from '../../../config/config.module';
import type { AppConfig } from '../../../config/app-config';

/**
 * Etiquetas de caché que el frontend usa en sus `fetch` (next: { tags }):
 * products, product:<slug>, categories, brands, home, banners, settings, pages, page:<slug>
 */
export const CacheTags = {
  products: 'products',
  product: (slug: string) => `product:${slug}`,
  categories: 'categories',
  brands: 'brands',
  home: 'home',
  banners: 'banners',
  settings: 'settings',
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
} as const;

/** Llama al webhook de revalidación ISR del frontend (no bloquea ni falla la operación). */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(@Inject(APP_CONFIG) private readonly cfg: AppConfig) {}

  revalidate(tags: string[]): void {
    void this.send(tags);
  }

  async send(tags: string[]): Promise<boolean> {
    const unique = [...new Set(tags)];
    if (!unique.length || !this.cfg.frontendUrl || !this.cfg.revalidateSecret) return false;
    try {
      const res = await fetch(`${this.cfg.frontendUrl.replace(/\/+$/, '')}/api/revalidate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-revalidate-secret': this.cfg.revalidateSecret },
        body: JSON.stringify({ tags: unique }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) this.logger.warn(`Revalidación respondió ${res.status} para [${unique.join(', ')}]`);
      return res.ok;
    } catch (err) {
      this.logger.warn(`No se pudo revalidar [${unique.join(', ')}]: ${(err as Error).message}`);
      return false;
    }
  }
}
