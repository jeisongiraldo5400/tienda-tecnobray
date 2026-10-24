import 'server-only';
import { cache } from 'react';
import { cacheTags } from '@/shared/api/cache-tags';
import { endpoints } from '@/shared/api/endpoints';
import { ApiError } from '@/shared/api/errors';
import { arr, asRecord, optStr, str } from '@/shared/api/normalize';
import { serverFetch, serverFetchSafe } from '@/shared/api/server-client';
import { toQueryString, type QueryValue } from '@/shared/lib/query-string';
import type { Brand, Category, Paginated, Product, ProductSummary } from '@/shared/types/domain';
import { flattenCategories, toBrand, toProduct, toProductSummary } from '../adapters/catalog.adapter';
import { toPaginated } from '@/shared/api/normalize';

export interface SitemapEntry {
  slug: string;
  updatedAt?: string;
}

/** Slugs de productos para sitemap.xml (GET /store/sitemap). */
export async function getSitemapProducts(): Promise<SitemapEntry[]> {
  const raw = await serverFetchSafe<unknown>(endpoints.store.sitemap, null, { tags: [cacheTags.products], revalidate: 3600 });
  const r = asRecord(raw);
  const list = Array.isArray(raw) ? raw : arr(r.products ?? r.items);
  return list
    .map((item) => {
      const it = asRecord(item);
      return { slug: str(it.slug), updatedAt: optStr(it.updatedAt ?? it.lastModified) };
    })
    .filter((e) => e.slug);
}

const EMPTY_PAGE: Paginated<ProductSummary> = { items: [], total: 0, page: 1, limit: 12, totalPages: 1 };

export const getCategories = cache(async (): Promise<Category[]> => {
  const raw = await serverFetchSafe<unknown>(endpoints.store.categories, [], { tags: [cacheTags.categories] });
  return flattenCategories(raw)
    .filter((c) => c.isActive)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name, 'es'));
});

export const getBrands = cache(async (): Promise<Brand[]> => {
  const raw = await serverFetchSafe<unknown>(endpoints.store.brands, [], { tags: [cacheTags.brands] });
  return arr(Array.isArray(raw) ? raw : (raw as { items?: unknown })?.items)
    .map(toBrand)
    .filter((b) => b.isActive)
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
});

/** Lista paginada de productos. Lanza en error (para mostrar estado de error en el catálogo). */
export async function getProducts(query: Record<string, QueryValue>): Promise<Paginated<ProductSummary>> {
  const raw = await serverFetch(`${endpoints.store.products}${toQueryString(query)}`, {
    tags: [cacheTags.products],
  });
  return toPaginated(raw, toProductSummary);
}

export async function getProductsSafe(query: Record<string, QueryValue>): Promise<Paginated<ProductSummary>> {
  try {
    return await getProducts(query);
  } catch {
    return EMPTY_PAGE;
  }
}

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  try {
    const raw = await serverFetch(endpoints.store.product(slug), {
      tags: [cacheTags.products, cacheTags.product(slug)],
    });
    return toProduct(raw);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
});

export async function getRelatedProducts(product: Product): Promise<ProductSummary[]> {
  if (product.related && product.related.length > 0) return product.related.slice(0, 8);
  const raw = await serverFetchSafe<unknown>(endpoints.store.related(product.slug), null, {
    tags: [cacheTags.products],
  });
  if (raw) {
    const list = toPaginated(raw, toProductSummary).items.filter((p) => p.id !== product.id);
    if (list.length > 0) return list.slice(0, 8);
  }
  if (!product.category?.slug) return [];
  const page = await getProductsSafe({ category: product.category.slug, pageSize: 9 });
  return page.items.filter((p) => p.id !== product.id).slice(0, 8);
}
