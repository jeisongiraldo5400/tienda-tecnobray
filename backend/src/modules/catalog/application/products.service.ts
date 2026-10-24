import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { paginate, type Paginated } from '../../../common/pagination/pagination';
import { markdownToSafeHtml } from '../../../common/utils/markdown';
import { slugify } from '../../../common/utils/slug';
import { CacheTags, RevalidationService } from '../../revalidation/application/revalidation.service';
import { StoreSettingsEntity } from '../../settings/infrastructure/persistence/store-settings.entity';
import { ImageUploadService, type UploadOptions } from '../../storage/application/image-upload.service';
import { BrandEntity } from '../infrastructure/persistence/brand.entity';
import { CategoryEntity } from '../infrastructure/persistence/category.entity';
import { ProductImageEntity } from '../infrastructure/persistence/product-image.entity';
import { ProductEntity } from '../infrastructure/persistence/product.entity';
import { CatalogMapper } from './catalog.mappers';
import type { AdminProductsQueryDto, CreateProductDto, UpdateImageDto, UpdateProductDto } from './catalog.dto';
import type { AdminProductImageView, AdminProductView } from './catalog.views';

export const MAX_IMAGES_PER_PRODUCT = 12;

const ADMIN_SORTS: Record<string, [string, 'ASC' | 'DESC']> = {
  newest: ['p.createdAt', 'DESC'],
  oldest: ['p.createdAt', 'ASC'],
  name: ['p.name', 'ASC'],
  price_asc: ['p.price', 'ASC'],
  price_desc: ['p.price', 'DESC'],
  stock_asc: ['p.stock', 'ASC'],
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity) private readonly images: Repository<ProductImageEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(BrandEntity) private readonly brands: Repository<BrandEntity>,
    @InjectRepository(StoreSettingsEntity) private readonly settings: Repository<StoreSettingsEntity>,
    private readonly dataSource: DataSource,
    private readonly mapper: CatalogMapper,
    private readonly uploads: ImageUploadService,
    private readonly revalidation: RevalidationService,
  ) {}

  async list(q: AdminProductsQueryDto): Promise<Paginated<AdminProductView>> {
    const qb = this.products
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.images', 'images');
    if (q.q) qb.andWhere('(lower(p.name) LIKE :q OR lower(p.sku) LIKE :q)', { q: `%${escapeLike(q.q.toLowerCase())}%` });
    if (q.categoryId) qb.andWhere('p.category_id = :categoryId', { categoryId: q.categoryId });
    if (q.brandId) qb.andWhere('p.brand_id = :brandId', { brandId: q.brandId });
    if (q.active !== undefined) qb.andWhere('p.active = :active', { active: q.active });
    if (q.featured !== undefined) qb.andWhere('p.featured = :featured', { featured: q.featured });
    if (q.lowStock) {
      const s = await this.settings.findOne({ where: { id: 1 } });
      qb.andWhere('p.stock <= :th', { th: s?.lowStockThreshold ?? 5 });
    }
    const [col, dir] = ADMIN_SORTS[q.sort ?? 'newest'] ?? ADMIN_SORTS.newest;
    qb.orderBy(col, dir).addOrderBy('p.id', 'ASC');
    qb.skip((q.page - 1) * q.pageSize).take(q.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    return paginate(rows.map((p) => this.mapper.adminProduct(p)), total, q.page, q.pageSize);
  }

  async get(id: string): Promise<AdminProductView> {
    return this.mapper.adminProduct(await this.load(id));
  }

  async create(dto: CreateProductDto): Promise<AdminProductView> {
    const slug = dto.slug || slugify(dto.name);
    if (!slug) throw new BadRequestException('No se pudo generar el slug.');
    await this.assertUnique(slug, dto.sku);
    await this.assertRefs(dto.categoryId, dto.brandId);
    assertComparePrice(dto.price, dto.compareAtPrice);
    const p = await this.products.save(
      this.products.create({
        name: dto.name,
        slug,
        sku: dto.sku,
        brandId: dto.brandId ?? null,
        categoryId: dto.categoryId ?? null,
        shortDescription: dto.shortDescription ?? '',
        description: dto.description ?? '',
        descriptionHtml: markdownToSafeHtml(dto.description ?? ''),
        price: dto.price,
        compareAtPrice: dto.compareAtPrice ?? null,
        stock: dto.stock,
        active: dto.active ?? true,
        featured: dto.featured ?? false,
        specs: dto.specs ?? [],
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
      }),
    );
    this.revalidate([p.slug]);
    return this.get(p.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<AdminProductView> {
    const p = await this.load(id);
    const oldSlug = p.slug;
    if ((dto.slug && dto.slug !== p.slug) || (dto.sku && dto.sku !== p.sku)) {
      await this.assertUnique(dto.slug && dto.slug !== p.slug ? dto.slug : null, dto.sku && dto.sku !== p.sku ? dto.sku : null);
    }
    await this.assertRefs(dto.categoryId, dto.brandId);
    const price = dto.price ?? p.price;
    const compare = dto.compareAtPrice !== undefined ? dto.compareAtPrice : p.compareAtPrice;
    assertComparePrice(price, compare);

    const patch: Partial<ProductEntity> = {};
    const keys = [
      'name', 'slug', 'sku', 'brandId', 'categoryId', 'shortDescription', 'price', 'compareAtPrice',
      'stock', 'active', 'featured', 'specs', 'seoTitle', 'seoDescription',
    ] as const;
    for (const k of keys) if (dto[k] !== undefined) (patch as Record<string, unknown>)[k] = dto[k];
    if (dto.description !== undefined) {
      patch.description = dto.description;
      patch.descriptionHtml = markdownToSafeHtml(dto.description);
    }
    // update() evita reescribir relaciones cargadas (brand/category) con valores viejos.
    if (Object.keys(patch).length) await this.products.update(id, patch);
    this.revalidate([oldSlug, patch.slug ?? oldSlug]);
    return this.get(id);
  }

  async remove(id: string): Promise<void> {
    const p = await this.load(id);
    const keys = (p.images ?? []).flatMap((i) => [i.largeKey, i.thumbKey]);
    await this.products.delete(id); // imágenes en BD: ON DELETE CASCADE; pedidos conservan su snapshot
    await this.uploads.remove(keys);
    this.revalidate([p.slug]);
  }

  // ---------- Imágenes ----------

  async addImages(id: string, files: Buffer[], opts: UploadOptions = {}): Promise<AdminProductImageView[]> {
    const p = await this.load(id);
    if (!files.length) throw new BadRequestException('No se recibieron imágenes.');
    const current = p.images?.length ?? 0;
    if (current + files.length > MAX_IMAGES_PER_PRODUCT) {
      throw new BadRequestException(`Máximo ${MAX_IMAGES_PER_PRODUCT} imágenes por producto.`);
    }
    let order = Math.max(-1, ...(p.images ?? []).map((i) => i.sortOrder)) + 1;
    let hasMain = (p.images ?? []).some((i) => i.isMain);
    for (const buf of files) {
      const up = await this.uploads.upload(buf, 'product', opts);
      try {
        await this.images.save(
          this.images.create({
            productId: id,
            largeKey: up.largeKey,
            thumbKey: up.thumbKey,
            width: up.width,
            height: up.height,
            alt: p.name,
            sortOrder: order++,
            isMain: !hasMain,
          }),
        );
      } catch (err) {
        await this.uploads.remove([up.largeKey, up.thumbKey]);
        throw err;
      }
      hasMain = true;
    }
    await this.touch(id);
    this.revalidate([p.slug]);
    return (await this.get(id)).images;
  }

  async reorderImages(id: string, imageIds: string[]): Promise<AdminProductImageView[]> {
    const p = await this.load(id);
    const ids = new Set((p.images ?? []).map((i) => i.id));
    if (imageIds.length !== ids.size || imageIds.some((x) => !ids.has(x))) {
      throw new BadRequestException('La lista debe contener exactamente las imágenes del producto.');
    }
    await this.dataSource.transaction(async (m) => {
      for (const [index, imageId] of imageIds.entries()) {
        await m.update(ProductImageEntity, { id: imageId, productId: id }, { sortOrder: index });
      }
    });
    await this.touch(id);
    this.revalidate([p.slug]);
    return (await this.get(id)).images;
  }

  async updateImage(id: string, imageId: string, dto: UpdateImageDto): Promise<AdminProductImageView[]> {
    const p = await this.load(id);
    const img = (p.images ?? []).find((i) => i.id === imageId);
    if (!img) throw new NotFoundException('Imagen no encontrada.');
    await this.dataSource.transaction(async (m) => {
      if (dto.isMain) await m.update(ProductImageEntity, { productId: id }, { isMain: false });
      await m.update(ProductImageEntity, { id: imageId }, {
        ...(dto.alt !== undefined && { alt: dto.alt }),
        ...(dto.isMain && { isMain: true }),
      });
    });
    await this.touch(id);
    this.revalidate([p.slug]);
    return (await this.get(id)).images;
  }

  async removeImage(id: string, imageId: string): Promise<AdminProductImageView[]> {
    const p = await this.load(id);
    const img = (p.images ?? []).find((i) => i.id === imageId);
    if (!img) throw new NotFoundException('Imagen no encontrada.');
    await this.images.delete(imageId);
    if (img.isMain) {
      const next = await this.images.findOne({ where: { productId: id }, order: { sortOrder: 'ASC' } });
      if (next) await this.images.update(next.id, { isMain: true });
    }
    await this.uploads.remove([img.largeKey, img.thumbKey]);
    await this.touch(id);
    this.revalidate([p.slug]);
    return (await this.get(id)).images;
  }

  // ---------- helpers ----------

  private async touch(id: string): Promise<void> {
    await this.products.update(id, { updatedAt: new Date() });
  }

  private revalidate(slugs: string[]): void {
    this.revalidation.revalidate([CacheTags.products, CacheTags.home, ...slugs.map(CacheTags.product)]);
  }

  private async load(id: string): Promise<ProductEntity> {
    const p = await this.products.findOne({ where: { id }, relations: { brand: true, category: true, images: true } });
    if (!p) throw new NotFoundException('Producto no encontrado.');
    return p;
  }

  private async assertUnique(slug: string | null | undefined, sku: string | null | undefined): Promise<void> {
    if (slug && (await this.products.exists({ where: { slug } }))) {
      throw new ConflictException('Ya existe un producto con ese slug.');
    }
    if (sku && (await this.products.exists({ where: { sku } }))) {
      throw new ConflictException('Ya existe un producto con ese SKU.');
    }
  }

  private async assertRefs(categoryId?: string | null, brandId?: string | null): Promise<void> {
    if (categoryId && !(await this.categories.exists({ where: { id: categoryId } }))) {
      throw new BadRequestException('La categoría no existe.');
    }
    if (brandId && !(await this.brands.exists({ where: { id: brandId } }))) {
      throw new BadRequestException('La marca no existe.');
    }
  }
}

export function assertComparePrice(price: number, compareAtPrice: number | null | undefined): void {
  if (compareAtPrice != null && compareAtPrice <= price) {
    throw new BadRequestException('El precio anterior debe ser mayor que el precio de venta.');
  }
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}
