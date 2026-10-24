/** Etiquetas de caché ISR. El backend las envía a /api/revalidate cuando cambia el contenido. */
export const cacheTags = {
  settings: 'settings',
  banners: 'banners',
  categories: 'categories',
  brands: 'brands',
  products: 'products',
  product: (slug: string) => `product:${slug}`,
  pages: 'pages',
  page: (slug: string) => `page:${slug}`,
  home: 'home',
} as const;

const ENTITY_TAGS: Record<string, string[]> = {
  settings: [cacheTags.settings, cacheTags.pages],
  banner: [cacheTags.banners],
  banners: [cacheTags.banners],
  category: [cacheTags.categories, cacheTags.products],
  categories: [cacheTags.categories, cacheTags.products],
  brand: [cacheTags.brands, cacheTags.products],
  brands: [cacheTags.brands, cacheTags.products],
  product: [cacheTags.products],
  products: [cacheTags.products],
  page: [cacheTags.pages],
  pages: [cacheTags.pages],
};

/** Traduce "entity" (+ slug opcional) a tags, para backends que envían {entity, slug}. */
export function tagsForEntity(entity: string, slug?: string): string[] {
  const tags = [...(ENTITY_TAGS[entity] ?? [])];
  if ((entity === 'product' || entity === 'products') && slug) tags.push(cacheTags.product(slug));
  return tags;
}
