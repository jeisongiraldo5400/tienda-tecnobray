import { arr, asRecord, bool, num, optNum, optStr, str } from '@/shared/api/normalize';
import type {
  Banner,
  Brand,
  Category,
  CategoryRef,
  ImageAsset,
  Product,
  ProductSpec,
  ProductSummary,
} from '@/shared/types/domain';

export function toImage(raw: unknown, alt = ''): ImageAsset | null {
  if (typeof raw === 'string') return raw ? { url: raw, alt } : null;
  const r = asRecord(raw);
  const url = str(r.url ?? r.src ?? r.publicUrl ?? r.imageUrl);
  if (!url) return null;
  return {
    id: optStr(r.id),
    url,
    thumbUrl: optStr(r.thumbUrl ?? r.thumbnailUrl),
    alt: str(r.alt ?? r.altText, alt),
    isMain: bool(r.isMain ?? r.isPrimary ?? r.main),
    position: num(r.position ?? r.sortOrder ?? r.order, 0),
  };
}

export function toImages(raw: unknown, alt = ''): ImageAsset[] {
  return arr(raw)
    .map((i) => toImage(i, alt))
    .filter((i): i is ImageAsset => i !== null)
    .sort((a, b) => Number(b.isMain) - Number(a.isMain) || (a.position ?? 0) - (b.position ?? 0));
}

export function toRef(raw: unknown): CategoryRef | null {
  const r = asRecord(raw);
  const id = str(r.id);
  const name = str(r.name);
  if (!id && !name) return null;
  return { id, name, slug: str(r.slug) };
}

export function toCategory(raw: unknown): Category {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    description: optStr(r.description),
    imageUrl: optStr(r.thumbUrl ?? r.imageUrl ?? asRecord(r.image).url ?? r.image),
    parentId: optStr(r.parentId) ?? null,
    productCount: optNum(r.productCount ?? r.productsCount) ?? undefined,
    position: num(r.position ?? r.sortOrder, 0),
    isActive: bool(r.isActive ?? r.active, true),
  };
}

/** Aplana el árbol de categorías del backend ({..., children: [...]}) asignando parentId. */
export function flattenCategories(raw: unknown): Category[] {
  const out: Category[] = [];
  const walk = (list: unknown, parentId: string | null) => {
    arr(list).forEach((node, index) => {
      const cat = toCategory(node);
      if (parentId && !cat.parentId) cat.parentId = parentId;
      if (!cat.position) cat.position = index;
      out.push(cat);
      walk(asRecord(node).children, cat.id || null);
    });
  };
  walk(Array.isArray(raw) ? raw : (asRecord(raw).items ?? asRecord(raw).categories), null);
  return out;
}

export function toBrand(raw: unknown): Brand {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    logoUrl: optStr(r.logoUrl ?? asRecord(r.logo).url ?? r.logo),
    isActive: bool(r.isActive ?? r.active, true),
  };
}

export function toBanner(raw: unknown): Banner {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    title: str(r.title),
    subtitle: optStr(r.subtitle ?? r.text ?? r.description),
    imageUrl: str(r.imageUrl ?? asRecord(r.image).url ?? r.image),
    mobileImageUrl: optStr(r.mobileImageUrl ?? asRecord(r.mobileImage).url),
    linkUrl: optStr(r.linkUrl ?? r.link ?? r.url),
    buttonText: optStr(r.buttonText ?? r.ctaText ?? r.cta),
    position: num(r.position ?? r.sortOrder, 0),
    isActive: bool(r.isActive ?? r.active, true),
  };
}

export function toSpecs(raw: unknown): ProductSpec[] {
  if (Array.isArray(raw)) {
    return raw
      .map((s) => {
        const r = asRecord(s);
        return { key: str(r.key ?? r.name ?? r.label), value: str(r.value) };
      })
      .filter((s) => s.key);
  }
  const r = asRecord(raw);
  return Object.entries(r).map(([key, value]) => ({ key, value: str(value) }));
}

export function toProductSummary(raw: unknown): ProductSummary {
  const r = asRecord(raw);
  const name = str(r.name);
  const images = toImages(r.images, name);
  const main = toImage(r.mainImage ?? r.image ?? r.imageUrl ?? r.thumbnail, name) ?? images[0];
  const inStockRaw = r.inStock;
  const stock = num(r.maxQuantity ?? r.stock ?? r.quantity, typeof inStockRaw === 'boolean' && inStockRaw ? 10 : 0);
  return {
    id: str(r.id),
    name,
    slug: str(r.slug),
    sku: optStr(r.sku),
    price: num(r.price),
    compareAtPrice: optNum(r.compareAtPrice ?? r.comparePrice ?? r.oldPrice),
    stock,
    inStock: typeof inStockRaw === 'boolean' ? inStockRaw && stock > 0 : stock > 0,
    shortDescription: optStr(r.shortDescription),
    image: main ?? undefined,
    brand: toRef(r.brand),
    category: toRef(r.category),
    isFeatured: bool(r.isFeatured ?? r.featured),
    isActive: bool(r.isActive ?? r.active, true),
    createdAt: optStr(r.createdAt),
  };
}

export function toProduct(raw: unknown): Product {
  const r = asRecord(raw);
  const summary = toProductSummary(raw);
  const images = toImages(r.images, summary.name);
  return {
    ...summary,
    images: images.length > 0 ? images : summary.image ? [summary.image] : [],
    description: optStr(r.descriptionHtml ?? r.description),
    specs: toSpecs(r.specs ?? r.specifications ?? r.attributes),
    lowStockThreshold: optNum(r.lowStockThreshold) ?? undefined,
    seoTitle: optStr(r.seoTitle ?? asRecord(r.seo).title),
    seoDescription: optStr(r.seoDescription ?? asRecord(r.seo).description),
    related: Array.isArray(r.related ?? r.relatedProducts)
      ? arr(r.related ?? r.relatedProducts).map(toProductSummary)
      : undefined,
  };
}

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export function stockState(stock: number, lowThreshold = 5): StockState {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowThreshold) return 'low_stock';
  return 'in_stock';
}
