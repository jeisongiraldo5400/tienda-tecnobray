import { Injectable } from '@nestjs/common';
import { MediaUrlService } from '../../storage/application/media-url.service';
import { publicStock } from '../domain/stock-policy';
import type { ProductImageEntity } from '../infrastructure/persistence/product-image.entity';
import type { ProductEntity } from '../infrastructure/persistence/product.entity';
import type { AdminProductImageView, AdminProductView, ImageView, ProductCardView } from './catalog.views';

export function sortImages(images: ProductImageEntity[] | undefined): ProductImageEntity[] {
  return [...(images ?? [])].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.sortOrder - b.sortOrder);
}

@Injectable()
export class CatalogMapper {
  constructor(private readonly media: MediaUrlService) {}

  image(img: ProductImageEntity, fallbackAlt: string): ImageView {
    return {
      url: this.media.url(img.largeKey)!,
      thumbUrl: this.media.url(img.thumbKey)!,
      alt: img.alt || fallbackAlt,
      width: img.width,
      height: img.height,
    };
  }

  card(p: ProductEntity): ProductCardView {
    const main = sortImages(p.images)[0];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      featured: p.featured,
      ...publicStock(p.stock, p.active),
      brand: p.brand ? { name: p.brand.name, slug: p.brand.slug } : null,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      image: main ? this.image(main, p.name) : null,
    };
  }

  adminImage(img: ProductImageEntity): AdminProductImageView {
    return {
      id: img.id,
      url: this.media.url(img.largeKey)!,
      thumbUrl: this.media.url(img.thumbKey)!,
      largeKey: img.largeKey,
      thumbKey: img.thumbKey,
      alt: img.alt,
      width: img.width,
      height: img.height,
      sortOrder: img.sortOrder,
      isMain: img.isMain,
    };
  }

  adminProduct(p: ProductEntity): AdminProductView {
    const images = [...(p.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const main = sortImages(p.images)[0];
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      brandId: p.brandId,
      categoryId: p.categoryId,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      shortDescription: p.shortDescription,
      description: p.description,
      descriptionHtml: p.descriptionHtml,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      active: p.active,
      featured: p.featured,
      specs: p.specs ?? [],
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      images: images.map((i) => this.adminImage(i)),
      mainImageThumbUrl: main ? this.media.url(main.thumbKey) : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
