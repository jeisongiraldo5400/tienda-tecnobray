import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { paginate, type Paginated } from '../../../common/pagination/pagination';
import { CategoryEntity } from '../infrastructure/persistence/category.entity';
import { ProductImageEntity } from '../infrastructure/persistence/product-image.entity';
import { ProductEntity } from '../infrastructure/persistence/product.entity';
import { CatalogMapper, sortImages } from './catalog.mappers';
import type { StoreProductsQueryDto } from './catalog.dto';
import type { ProductCardView, ProductDetailView } from './catalog.views';
import { escapeLike } from './products.service';

/** Consultas públicas del catálogo (solo productos activos). */
@Injectable()
export class CatalogQueryService {
  constructor(
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ProductImageEntity) private readonly images: Repository<ProductImageEntity>,
    private readonly mapper: CatalogMapper,
  ) {}

  /**
   * Solo relaciones N:1 (marca, categoría) para que OFFSET/LIMIT y ORDER BY con
   * expresiones funcionen sin la subconsulta DISTINCT de TypeORM; las imágenes se
   * cargan después en una sola consulta (attachImages).
   */
  private base(): SelectQueryBuilder<ProductEntity> {
    return this.products
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.active = true');
  }

  private async attachImages(rows: ProductEntity[]): Promise<ProductEntity[]> {
    if (!rows.length) return rows;
    const imgs = await this.images.find({ where: { productId: In(rows.map((r) => r.id)) } });
    for (const r of rows) r.images = imgs.filter((i) => i.productId === r.id);
    return rows;
  }

  private async cards(qb: SelectQueryBuilder<ProductEntity>): Promise<ProductCardView[]> {
    const rows = await this.attachImages(await qb.getMany());
    return rows.map((p) => this.mapper.card(p));
  }

  async search(q: StoreProductsQueryDto): Promise<Paginated<ProductCardView>> {
    const qb = this.base();
    if (q.q) {
      qb.andWhere('(lower(p.name) LIKE :q OR lower(p.sku) LIKE :q OR lower(brand.name) LIKE :q)', {
        q: `%${escapeLike(q.q.toLowerCase())}%`,
      });
    }
    if (q.category) {
      const ids = await this.categoryIdsForSlug(q.category);
      if (!ids.length) return paginate([], 0, q.page, q.pageSize);
      qb.andWhere('p.category_id IN (:...catIds)', { catIds: ids });
    }
    if (q.brand) qb.andWhere('brand.slug IN (:...brands)', { brands: q.brand.split(',') });
    if (q.minPrice !== undefined) qb.andWhere('p.price >= :minPrice', { minPrice: q.minPrice });
    if (q.maxPrice !== undefined) qb.andWhere('p.price <= :maxPrice', { maxPrice: q.maxPrice });
    if (q.inStock) qb.andWhere('p.stock > 0');
    if (q.featured) qb.andWhere('p.featured = true');

    switch (q.sort) {
      case 'price_asc':
        qb.orderBy('p.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('p.price', 'DESC');
        break;
      case 'name':
        qb.orderBy('p.name', 'ASC');
        break;
      case 'newest':
        qb.orderBy('p.createdAt', 'DESC');
        break;
      default:
        // Relevancia: disponibles primero, luego destacados y más recientes.
        qb.orderBy('CASE WHEN p.stock > 0 THEN 0 ELSE 1 END', 'ASC')
          .addOrderBy('p.featured', 'DESC')
          .addOrderBy('p.createdAt', 'DESC');
    }
    qb.addOrderBy('p.id', 'ASC').offset((q.page - 1) * q.pageSize).limit(q.pageSize);
    const [rows, total] = await qb.getManyAndCount();
    await this.attachImages(rows);
    return paginate(rows.map((p) => this.mapper.card(p)), total, q.page, q.pageSize);
  }

  async featured(limit = 8): Promise<ProductCardView[]> {
    return this.cards(this.base().andWhere('p.featured = true').orderBy('p.updatedAt', 'DESC').limit(limit));
  }

  async newest(limit = 8): Promise<ProductCardView[]> {
    return this.cards(this.base().orderBy('p.createdAt', 'DESC').limit(limit));
  }

  async byIds(ids: string[]): Promise<ProductCardView[]> {
    if (!ids.length) return [];
    const rows = await this.attachImages(await this.base().andWhere('p.id IN (:...ids)', { ids }).getMany());
    const byId = new Map(rows.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is ProductEntity => !!p).map((p) => this.mapper.card(p));
  }

  async detail(slug: string): Promise<ProductDetailView> {
    const p = await this.base().leftJoinAndSelect('category.parent', 'parentCat').andWhere('p.slug = :slug', { slug }).getOne();
    if (!p) throw new NotFoundException('Producto no encontrado.');
    await this.attachImages([p]);
    const card = this.mapper.card(p);
    const related = await this.related(p);
    return {
      ...card,
      sku: p.sku,
      descriptionHtml: p.descriptionHtml,
      specs: p.specs ?? [],
      images: sortImages(p.images).map((i) => this.mapper.image(i, p.name)),
      seo: {
        title: p.seoTitle || p.name,
        description: p.seoDescription || p.shortDescription || p.name,
      },
      category: p.category
        ? {
            name: p.category.name,
            slug: p.category.slug,
            parent: p.category.parent ? { name: p.category.parent.name, slug: p.category.parent.slug } : null,
          }
        : null,
      updatedAt: p.updatedAt.toISOString(),
      related,
    };
  }

  private async related(p: ProductEntity, limit = 8): Promise<ProductCardView[]> {
    if (!p.categoryId) return [];
    return this.cards(
      this.base()
        .andWhere('p.category_id = :cat AND p.id <> :id', { cat: p.categoryId, id: p.id })
        .orderBy('CASE WHEN p.stock > 0 THEN 0 ELSE 1 END', 'ASC')
        .addOrderBy('p.featured', 'DESC')
        .addOrderBy('p.createdAt', 'DESC')
        .limit(limit),
    );
  }

  /** Rango de precios de los productos activos (para el filtro de precio). */
  async priceRange(): Promise<{ min: number; max: number }> {
    const r = await this.products
      .createQueryBuilder('p')
      .select('COALESCE(MIN(p.price),0)::int', 'min')
      .addSelect('COALESCE(MAX(p.price),0)::int', 'max')
      .where('p.active = true')
      .getRawOne<{ min: number; max: number }>();
    return { min: Number(r?.min ?? 0), max: Number(r?.max ?? 0) };
  }

  async sitemap(): Promise<{
    products: Array<{ slug: string; updatedAt: string }>;
    categories: Array<{ slug: string; updatedAt: string }>;
  }> {
    const [products, categories] = await Promise.all([
      this.products.find({ where: { active: true }, select: { slug: true, updatedAt: true }, order: { updatedAt: 'DESC' } }),
      this.categories.find({ where: { active: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return {
      products: products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt.toISOString() })),
      categories: categories.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt.toISOString() })),
    };
  }

  private async categoryIdsForSlug(slug: string): Promise<string[]> {
    const cat = await this.categories.findOne({ where: { slug, active: true } });
    if (!cat) return [];
    const children = await this.categories.find({ where: { parentId: cat.id, active: true }, select: { id: true } });
    return [cat.id, ...children.map((c) => c.id)];
  }
}
