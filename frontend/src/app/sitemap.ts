import type { MetadataRoute } from 'next';
import { getCategories, getProductsSafe, getSitemapProducts } from '@/features/catalog/services/catalog.server';
import { getStoreSettings } from '@/features/settings/services/settings.server';
import { publicEnv } from '@/shared/config/env.public';

export const revalidate = 3600;

const PAGE_SIZE = 48;
const MAX_PAGES = 100;

/** Usa /store/sitemap; si no está disponible, recorre el catálogo paginado. */
async function productEntries(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  const fromSitemap = await getSitemapProducts();
  if (fromSitemap.length > 0) return fromSitemap;
  const first = await getProductsSafe({ page: 1, pageSize: PAGE_SIZE });
  const items = first.items.map((p) => ({ slug: p.slug, updatedAt: p.createdAt }));
  for (let page = 2; page <= Math.min(first.totalPages, MAX_PAGES); page++) {
    const next = await getProductsSafe({ page, pageSize: PAGE_SIZE });
    if (next.items.length === 0) break;
    items.push(...next.items.map((p) => ({ slug: p.slug, updatedAt: p.createdAt })));
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = publicEnv.siteUrl;
  const [settings, categories, products] = await Promise.all([getStoreSettings(), getCategories(), productEntries()]);
  const now = new Date();
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${site}/productos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site}/seguimiento`, changeFrequency: 'yearly', priority: 0.3 },
    ...categories.map((c) => ({
      url: `${site}/categoria/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${site}/producto/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...settings.policies.map((p) => ({ url: `${site}/politicas/${p.slug}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
