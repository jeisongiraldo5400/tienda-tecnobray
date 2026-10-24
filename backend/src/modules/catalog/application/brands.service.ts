import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { slugify } from '../../../common/utils/slug';
import { CacheTags, RevalidationService } from '../../revalidation/application/revalidation.service';
import { ImageUploadService } from '../../storage/application/image-upload.service';
import { MediaUrlService } from '../../storage/application/media-url.service';
import { BrandEntity } from '../infrastructure/persistence/brand.entity';
import { ProductEntity } from '../infrastructure/persistence/product.entity';
import type { CreateBrandDto, UpdateBrandDto } from './catalog.dto';
import type { AdminBrandView, BrandView } from './catalog.views';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(BrandEntity) private readonly brands: Repository<BrandEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    private readonly media: MediaUrlService,
    private readonly uploads: ImageUploadService,
    private readonly revalidation: RevalidationService,
  ) {}

  async listAdmin(): Promise<AdminBrandView[]> {
    const rows = await this.brands.find({ order: { name: 'ASC' } });
    const counts = await this.products
      .createQueryBuilder('p')
      .select('p.brand_id', 'id')
      .addSelect('COUNT(*)::int', 'count')
      .where('p.brand_id IS NOT NULL')
      .groupBy('p.brand_id')
      .getRawMany<{ id: string; count: number }>();
    const map = new Map(counts.map((c) => [c.id, Number(c.count)]));
    return rows.map((b) => ({ ...this.toView(b), active: b.active, productCount: map.get(b.id) ?? 0 }));
  }

  async listPublic(): Promise<BrandView[]> {
    const rows = await this.brands.find({ where: { active: true }, order: { name: 'ASC' } });
    return rows.map((b) => this.toView(b));
  }

  async create(dto: CreateBrandDto): Promise<AdminBrandView> {
    const slug = dto.slug || slugify(dto.name);
    if (!slug) throw new BadRequestException('No se pudo generar el slug.');
    if (await this.brands.exists({ where: { slug } })) throw new ConflictException('Ya existe una marca con ese slug.');
    const b = await this.brands.save(this.brands.create({ name: dto.name, slug, active: dto.active ?? true }));
    this.revalidate();
    return { ...this.toView(b), active: b.active, productCount: 0 };
  }

  async update(id: string, dto: UpdateBrandDto): Promise<AdminBrandView> {
    const b = await this.find(id);
    if (dto.slug && dto.slug !== b.slug && (await this.brands.exists({ where: { slug: dto.slug } }))) {
      throw new ConflictException('Ya existe una marca con ese slug.');
    }
    if (dto.name !== undefined) b.name = dto.name;
    if (dto.slug) b.slug = dto.slug;
    if (dto.active !== undefined) b.active = dto.active;
    await this.brands.save(b);
    this.revalidate();
    return this.adminOne(id);
  }

  async remove(id: string): Promise<void> {
    const b = await this.find(id);
    await this.brands.delete(id);
    await this.uploads.remove([b.logoKey]);
    this.revalidate();
  }

  async setLogo(id: string, buffer: Buffer): Promise<AdminBrandView> {
    const b = await this.find(id);
    const up = await this.uploads.upload(buffer, 'brand');
    const old = b.logoKey;
    b.logoKey = up.largeKey;
    await this.brands.save(b);
    // El preset de marca genera 2 variantes; guardamos la grande y borramos la miniatura sin uso.
    await this.uploads.remove([old, old ? old.replace(/\/400\.webp$/, '/200.webp') : null, up.thumbKey]);
    this.revalidate();
    return this.adminOne(id);
  }

  async removeLogo(id: string): Promise<AdminBrandView> {
    const b = await this.find(id);
    const old = b.logoKey;
    b.logoKey = null;
    await this.brands.save(b);
    await this.uploads.remove([old, old ? old.replace(/\/400\.webp$/, '/200.webp') : null]);
    this.revalidate();
    return this.adminOne(id);
  }

  private async adminOne(id: string): Promise<AdminBrandView> {
    const all = await this.listAdmin();
    const found = all.find((b) => b.id === id);
    if (!found) throw new NotFoundException('Marca no encontrada.');
    return found;
  }

  private toView(b: BrandEntity): BrandView {
    return { id: b.id, name: b.name, slug: b.slug, logoUrl: this.media.url(b.logoKey) };
  }

  private revalidate(): void {
    this.revalidation.revalidate([CacheTags.brands, CacheTags.products]);
  }

  private async find(id: string): Promise<BrandEntity> {
    const b = await this.brands.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Marca no encontrada.');
    return b;
  }
}
