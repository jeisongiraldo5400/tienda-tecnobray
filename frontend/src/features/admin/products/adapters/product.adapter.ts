import { arr, asRecord, bool, num, optNum, optStr, str, toPaginated } from '@/shared/api/normalize';
import type { Paginated, ProductSpec } from '@/shared/types/domain';
import { toSpecs } from '@/features/catalog/adapters/catalog.adapter';

export interface AdminProductImage {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  sortOrder: number;
  isMain: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brandId: string | null;
  categoryId: string | null;
  brandName?: string;
  categoryName?: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  specs: ProductSpec[];
  seoTitle: string;
  seoDescription: string;
  images: AdminProductImage[];
  mainImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function toAdminProductImage(raw: unknown): AdminProductImage {
  const r = asRecord(raw);
  const url = str(r.url);
  return {
    id: str(r.id),
    url,
    thumbUrl: str(r.thumbUrl, url),
    alt: str(r.alt),
    sortOrder: num(r.sortOrder ?? r.position, 0),
    isMain: bool(r.isMain),
  };
}

export function toAdminProductImages(raw: unknown): AdminProductImage[] {
  const list = Array.isArray(raw) ? raw : arr(asRecord(raw).images);
  return list.map(toAdminProductImage).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function toAdminProduct(raw: unknown): AdminProduct {
  const r = asRecord(raw);
  const brand = asRecord(r.brand);
  const category = asRecord(r.category);
  const images = toAdminProductImages(r.images);
  const main = images.find((i) => i.isMain) ?? images[0];
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    sku: str(r.sku),
    brandId: optStr(r.brandId ?? brand.id) ?? null,
    categoryId: optStr(r.categoryId ?? category.id) ?? null,
    brandName: optStr(brand.name),
    categoryName: optStr(category.name),
    shortDescription: str(r.shortDescription),
    description: str(r.description),
    price: num(r.price),
    compareAtPrice: optNum(r.compareAtPrice),
    stock: num(r.stock),
    active: bool(r.active ?? r.isActive, true),
    featured: bool(r.featured ?? r.isFeatured),
    specs: toSpecs(r.specs),
    seoTitle: str(r.seoTitle),
    seoDescription: str(r.seoDescription),
    images,
    mainImageUrl: optStr(r.mainImageThumbUrl) ?? main?.thumbUrl,
    createdAt: optStr(r.createdAt),
    updatedAt: optStr(r.updatedAt),
  };
}

export function toAdminProductsPage(raw: unknown): Paginated<AdminProduct> {
  return toPaginated(raw, toAdminProduct);
}

/** Valores del formulario (strings para inputs numéricos opcionales). */
export interface ProductFormValues {
  name: string;
  slug: string;
  sku: string;
  brandId: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: number | '';
  compareAtPrice: number | '';
  stock: number | '';
  active: boolean;
  featured: boolean;
  specs: ProductSpec[];
  seoTitle: string;
  seoDescription: string;
}

export const emptyProductForm: ProductFormValues = {
  name: '',
  slug: '',
  sku: '',
  brandId: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  price: '',
  compareAtPrice: '',
  stock: 0,
  active: true,
  featured: false,
  specs: [],
  seoTitle: '',
  seoDescription: '',
};

export function productToForm(p: AdminProduct): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brandId: p.brandId ?? '',
    categoryId: p.categoryId ?? '',
    shortDescription: p.shortDescription,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? '',
    stock: p.stock,
    active: p.active,
    featured: p.featured,
    specs: p.specs.map((s) => ({ ...s })),
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

export interface ProductPayload {
  name: string;
  slug?: string;
  sku: string;
  brandId: string | null;
  categoryId: string | null;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  specs: ProductSpec[];
  seoTitle: string | null;
  seoDescription: string | null;
}

/** Convierte el formulario al DTO del backend (CreateProductDto / UpdateProductDto). */
export function formToProductPayload(v: ProductFormValues): ProductPayload {
  const slug = v.slug.trim();
  return {
    name: v.name.trim(),
    ...(slug ? { slug } : {}),
    sku: v.sku.trim(),
    brandId: v.brandId || null,
    categoryId: v.categoryId || null,
    shortDescription: v.shortDescription.trim(),
    description: v.description,
    price: Math.round(Number(v.price) || 0),
    compareAtPrice: v.compareAtPrice === '' ? null : Math.round(Number(v.compareAtPrice)),
    stock: Math.round(Number(v.stock) || 0),
    active: v.active,
    featured: v.featured,
    specs: v.specs.map((s) => ({ key: s.key.trim(), value: s.value.trim() })).filter((s) => s.key && s.value),
    seoTitle: v.seoTitle.trim() || null,
    seoDescription: v.seoDescription.trim() || null,
  };
}
