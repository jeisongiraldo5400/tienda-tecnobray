import 'server-only';
import { cache } from 'react';
import { cacheTags } from '@/shared/api/cache-tags';
import { endpoints } from '@/shared/api/endpoints';
import { ApiError } from '@/shared/api/errors';
import { arr, asRecord, str } from '@/shared/api/normalize';
import { serverFetch } from '@/shared/api/server-client';
import type { PolicyPage, StoreSettings } from '@/shared/types/domain';
import { DEFAULT_SETTINGS, toStoreSettings } from '../adapters/settings.adapter';

/** Lista de políticas (GET /store/pages) → solo slug y título. */
const getPolicyList = cache(async (): Promise<PolicyPage[] | null> => {
  try {
    const raw = await serverFetch(endpoints.store.pages, { tags: [cacheTags.pages] });
    const list = arr(Array.isArray(raw) ? raw : asRecord(raw).items)
      .map((p) => {
        const r = asRecord(p);
        return { slug: str(r.slug), title: str(r.title, str(r.slug)), content: '' };
      })
      .filter((p) => p.slug);
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
});

/** Settings de la tienda (deduplicado por request). Si el backend falla usa valores por defecto. */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const [settings, policies] = await Promise.all([
    serverFetch(endpoints.store.settings, { tags: [cacheTags.settings] })
      .then(toStoreSettings)
      .catch(() => DEFAULT_SETTINGS),
    getPolicyList(),
  ]);
  return policies ? { ...settings, policies } : settings;
});

/** Página de política desde GET /store/pages/:slug (usa contentHtml sanitizado por el backend). */
export const getPolicyPage = cache(async (slug: string): Promise<PolicyPage | null> => {
  try {
    const r = asRecord(await serverFetch(endpoints.store.page(slug), { tags: [cacheTags.pages, cacheTags.page(slug)] }));
    if (!r.slug && !r.title) return null;
    return { slug, title: str(r.title, slug), content: str(r.contentHtml ?? r.content) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    // Backend no disponible: usar el texto por defecto si existe.
    return DEFAULT_SETTINGS.policies.find((p) => p.slug === slug) ?? null;
  }
});
