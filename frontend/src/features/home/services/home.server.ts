import 'server-only';
import { cache } from 'react';
import { flattenCategories, toBanner, toProductSummary } from '@/features/catalog/adapters/catalog.adapter';
import { getBrands, getCategories, getProductsSafe } from '@/features/catalog/services/catalog.server';
import { cacheTags } from '@/shared/api/cache-tags';
import { endpoints } from '@/shared/api/endpoints';
import { arr, asRecord, optStr, str } from '@/shared/api/normalize';
import { serverFetch } from '@/shared/api/server-client';
import type { Banner, Category, ProductSummary } from '@/shared/types/domain';

export interface HomeSection {
  id: string;
  title: string;
  subtitle?: string;
  products: ProductSummary[];
}

export interface HomeData {
  banners: Banner[];
  categories: Category[];
  featured: ProductSummary[];
  newest: ProductSummary[];
  sections: HomeSection[];
}

export function toHomeData(raw: unknown): HomeData {
  const r = asRecord(raw);
  return {
    banners: arr(r.banners)
      .map((b) => {
        const banner = toBanner(b);
        const thumb = optStr(asRecord(b).thumbUrl);
        return { ...banner, mobileImageUrl: banner.mobileImageUrl ?? thumb };
      })
      .filter((b) => b.isActive && b.imageUrl)
      .sort((a, b) => a.position - b.position),
    categories: flattenCategories(r.categories).filter((c) => c.isActive),
    featured: arr(r.featured).map(toProductSummary),
    newest: arr(r.newest).map(toProductSummary),
    sections: arr(r.sections)
      .map((s) => {
        const sr = asRecord(s);
        return { id: str(sr.id), title: str(sr.title), subtitle: optStr(sr.subtitle), products: arr(sr.products).map(toProductSummary) };
      })
      .filter((s) => s.title && s.products.length > 0),
  };
}

/** GET /store/home; si falla, arma el inicio con los endpoints individuales. */
export const getHomeData = cache(async (): Promise<HomeData> => {
  try {
    const raw = await serverFetch(endpoints.store.home, { tags: [cacheTags.home, cacheTags.banners, cacheTags.products] });
    return toHomeData(raw);
  } catch {
    const [categories, featured, newest] = await Promise.all([
      getCategories(),
      getProductsSafe({ featured: true, pageSize: 8 }),
      getProductsSafe({ sort: 'newest', pageSize: 8 }),
      getBrands(),
    ]);
    return { banners: [], categories, featured: featured.items, newest: newest.items, sections: [] };
  }
});
