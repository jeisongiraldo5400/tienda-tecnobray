import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify } from '../../../common/utils/slug';
import { CacheTags, RevalidationService } from '../../revalidation/application/revalidation.service';
import { ImageUploadService } from '../../storage/application/image-upload.service';
import { MediaUrlService } from '../../storage/application/media-url.service';
import { CategoryEntity } from '../infrastructure/persistence/category.entity';
import { ProductEntity } from '../infrastructure/persistence/product.entity';
import type { CreateCategoryDto, UpdateCategoryDto } from './catalog.dto';
import type { AdminCategoryView, CategoryNodeView } from './catalog.views';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity) private readonly categories: Repository<CategoryEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    private readonly media: MediaUrlService,
    private readonly uploads: ImageUploadService,
    private readonly revalidation: RevalidationService,
  ) {}

  private async counts(activeOnly: boolean): Promise<Map<string, number>> {
    const qb = this.products
      .createQueryBuilder('p')
      .select('p.category_id', 'id')
      .addSelect('COUNT(*)::int', 'count')
      .where('p.category_id IS NOT NULL')
      .groupBy('p.category_id');
    if (activeOnly) qb.andWhere('p.active = true');
    const rows = await qb.getRawMany<{ id: string; count: number }>();
    return new Map(rows.map((r) => [r.id, Number(r.count)]));
  }

  private toAdmin(c: CategoryEntity, counts: Map<string, number>): AdminCategoryView {
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      imageUrl: this.media.url(c.imageKey),
      thumbUrl: this.media.url(c.imageThumbKey),
      sortOrder: c.sortOrder,
      active: c.active,
      productCount: counts.get(c.id) ?? 0,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }

  async listAdmin(): Promise<AdminCategoryView[]> {
    const [rows, counts] = await Promise.all([
      this.categories.find({ order: { sortOrder: 'ASC', name: 'ASC' } }),
      this.counts(false),
    ]);
    return rows.map((c) => this.toAdmin(c, counts));
  }

  async getAdmin(id: string): Promise<AdminCategoryView> {
    return this.toAdmin(await this.find(id), await this.counts(false));
  }

  /** Árbol público (solo activas). El conteo de una categoría padre incluye sus hijas. */
  async tree(): Promise<CategoryNodeView[]> {
    const [rows, counts] = await Promise.all([
      this.categories.find({ where: { active: true }, order: { sortOrder: 'ASC', name: 'ASC' } }),
      this.counts(true),
    ]);
    const node = (c: CategoryEntity): CategoryNodeView => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: this.media.url(c.imageKey),
      thumbUrl: this.media.url(c.imageThumbKey),
      productCount: counts.get(c.id) ?? 0,
      children: [],
    });
    const roots = rows.filter((c) => !c.parentId).map(node);
    const byId = new Map(roots.map((r) => [r.id, r]));
    for (const c of rows.filter((x) => x.parentId)) {
      const parent = byId.get(c.parentId!);
      if (!parent) continue;
      const child = node(c);
      parent.children.push(child);
      parent.productCount += child.productCount;
    }
    return roots;
  }

  async create(dto: CreateCategoryDto): Promise<AdminCategoryView> {
    const slug = dto.slug || slugify(dto.name);
    if (!slug) throw new BadRequestException('No se pudo generar el slug.');
    await this.assertSlugFree(slug);
    if (dto.parentId) await this.assertValidParent(dto.parentId, null);
    const saved = await this.categories.save(
      this.categories.create({
        name: dto.name,
        slug,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      }),
    );
    this.revalidate();
    return this.getAdmin(saved.id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<AdminCategoryView> {
    const c = await this.find(id);
    if (dto.slug && dto.slug !== c.slug) await this.assertSlugFree(dto.slug, id);
    if (dto.parentId !== undefined && dto.parentId !== c.parentId) {
      if (dto.parentId) await this.assertValidParent(dto.parentId, id);
    }
    Object.assign(c, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.active !== undefined && { active: dto.active }),
    });
    await this.categories.save(c);
    this.revalidate();
    return this.getAdmin(id);
  }

  async remove(id: string): Promise<void> {
    const c = await this.find(id);
    const children = await this.categories.count({ where: { parentId: id } });
    if (children) throw new ConflictException('La categoría tiene subcategorías. Muévelas o elimínalas primero.');
    await this.categories.delete(id); // los productos quedan sin categoría (ON DELETE SET NULL)
    await this.uploads.remove([c.imageKey, c.imageThumbKey]);
    this.revalidate();
  }

  async setImage(id: string, buffer: Buffer): Promise<AdminCategoryView> {
    const c = await this.find(id);
    const up = await this.uploads.upload(buffer, 'category');
    const old = [c.imageKey, c.imageThumbKey];
    c.imageKey = up.largeKey;
    c.imageThumbKey = up.thumbKey;
    await this.categories.save(c);
    await this.uploads.remove(old);
    this.revalidate();
    return this.getAdmin(id);
  }

  async removeImage(id: string): Promise<AdminCategoryView> {
    const c = await this.find(id);
    const old = [c.imageKey, c.imageThumbKey];
    c.imageKey = null;
    c.imageThumbKey = null;
    await this.categories.save(c);
    await this.uploads.remove(old);
    this.revalidate();
    return this.getAdmin(id);
  }

  private revalidate(): void {
    this.revalidation.revalidate([CacheTags.categories, CacheTags.home, CacheTags.products]);
  }

  private async find(id: string): Promise<CategoryEntity> {
    const c = await this.categories.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Categoría no encontrada.');
    return c;
  }

  private async assertSlugFree(slug: string, exceptId?: string): Promise<void> {
    const other = await this.categories.findOne({ where: { slug } });
    if (other && other.id !== exceptId) throw new ConflictException('Ya existe una categoría con ese slug.');
  }

  /** Solo un nivel: el padre debe ser raíz y la categoría editada no puede tener hijas. */
  private async assertValidParent(parentId: string, selfId: string | null): Promise<void> {
    if (parentId === selfId) throw new BadRequestException('Una categoría no puede ser su propia madre.');
    const parent = await this.categories.findOne({ where: { id: parentId } });
    if (!parent) throw new BadRequestException('La categoría padre no existe.');
    if (parent.parentId) throw new BadRequestException('Solo se permite un nivel de subcategorías.');
    if (selfId && (await this.categories.count({ where: { parentId: selfId } }))) {
      throw new BadRequestException('Esta categoría tiene subcategorías; no puede convertirse en subcategoría.');
    }
  }
}
