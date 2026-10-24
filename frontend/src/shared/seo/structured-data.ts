import type { Product, StoreSettings } from '@/shared/types/domain';

export function absoluteUrl(siteUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function organizationJsonLd(settings: StoreSettings, siteUrl: string): Record<string, unknown> {
  const sameAs = Object.values(settings.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName,
    url: siteUrl,
    ...(settings.logoUrl ? { logo: absoluteUrl(siteUrl, settings.logoUrl) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(settings.contact.phone || settings.contact.whatsapp || settings.contact.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            areaServed: 'CO',
            availableLanguage: 'es',
            ...(settings.contact.phone || settings.contact.whatsapp
              ? { telephone: settings.contact.phone ?? settings.contact.whatsapp }
              : {}),
            ...(settings.contact.email ? { email: settings.contact.email } : {}),
          },
        }
      : {}),
  };
}

export function websiteJsonLd(settings: StoreSettings, siteUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: settings.storeName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/productos?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function productJsonLd(product: Product, settings: StoreSettings, siteUrl: string): Record<string, unknown> {
  const url = absoluteUrl(siteUrl, `/producto/${product.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url,
    ...(product.sku ? { sku: product.sku } : {}),
    description: product.seoDescription ?? product.shortDescription ?? stripHtml(product.description ?? '').slice(0, 300),
    image: product.images.map((i) => absoluteUrl(siteUrl, i.url)),
    ...(product.brand?.name ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
    ...(product.category?.name ? { category: product.category.name } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'COP',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: settings.storeName },
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: item.url })),
  };
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
