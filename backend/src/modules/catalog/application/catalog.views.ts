import type { ProductSpec } from '../infrastructure/persistence/product.entity';

export interface ImageView {
  url: string;
  thumbUrl: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductCardView {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  featured: boolean;
  inStock: boolean;
  maxQuantity: number;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  image: ImageView | null;
}

export interface ProductDetailView extends ProductCardView {
  sku: string;
  descriptionHtml: string;
  specs: ProductSpec[];
  images: ImageView[];
  seo: { title: string; description: string };
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null;
  updatedAt: string;
  related: ProductCardView[];
}

export interface CategoryNodeView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  productCount: number;
  children: CategoryNodeView[];
}

export interface BrandView {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface AdminProductImageView {
  id: string;
  url: string;
  thumbUrl: string;
  largeKey: string;
  thumbKey: string;
  alt: string;
  width: number;
  height: number;
  sortOrder: number;
  isMain: boolean;
}

export interface AdminProductView {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brandId: string | null;
  categoryId: string | null;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  shortDescription: string;
  description: string;
  descriptionHtml: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  specs: ProductSpec[];
  seoTitle: string | null;
  seoDescription: string | null;
  images: AdminProductImageView[];
  mainImageThumbUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBrandView {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  active: boolean;
  productCount: number;
}
