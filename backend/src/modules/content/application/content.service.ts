import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { sortImages } from '../../catalog/application/catalog.mappers';
import { ProductEntity } from '../../catalog/infrastructure/persistence/product.entity';
import { CacheTags, RevalidationService } from '../../revalidation/application/revalidation.service';
import { ImageUploadService } from '../../storage/application/image-upload.service';
import { MediaUrlService } from '../../storage/application/media-url.service';
import { BannerEntity } from '../infrastructure/persistence/banner.entity';
import { FeaturedSectionEntity } from '../infrastructure/persistence/featured-section.entity';
import type {
  AdminSectionView,
  BannerView,
  CreateBannerDto,
  CreateSectionDto,
  UpdateBannerDto,
  UpdateSectionDto,
} from './content.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(BannerEntity) private readonly banners: Repository<BannerEntity>,
    @InjectRepository(FeaturedSectionEntity) private readonly sections: Repository<FeaturedSectionEntity>,
    @InjectRepository(ProductEntity) private readonly products: Repository<ProductEntity>,
    private readonly media: MediaUrlService,
    private readonly uploads: ImageUploadService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ---------- Banners ----------

  bannerView(b: BannerEntity): BannerView {
    return {
      id: b.id,
      title: b.title,
      text: b.text,
      linkUrl: b.linkUrl,
      buttonText: b.buttonText,
      imageUrl: this.media.url(b.imageKey),
      thumbUrl: this.media.url(b.imageThumbKey),
      sortOrder: b.sortOrder,
      active: b.active,
    };
  }

  async listBanners(): Promise<BannerView[]> {
    const rows = await this.banners.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return rows.map((b) => this.bannerView(b));
  }

  /** Solo banners activos y con imagen. */
  async publicBanners(): Promise<BannerView[]> {
    const rows = await this.banners.find({ where: { active: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return rows.filter((b) => b.imageKey).map((b) => this.bannerView(b));
  }

  async createBanner(dto: CreateBannerDto): Promise<BannerView> {
    const b = await this.banners.save(
      this.banners.create({
        title: dto.title,
        text: dto.text ?? '',
        linkUrl: dto.linkUrl ?? null,
        buttonText: dto.buttonText ?? null,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      }),
    );
    this.revalidateHome();
    return this.bannerView(b);
  }

  async updateBanner(id: string, dto: UpdateBannerDto): Promise<BannerView> {
    const b = await this.findBanner(id);
    Object.assign(b, Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)));
    await this.banners.save(b);
    this.revalidateHome();
    return this.bannerView(b);
  }

  async removeBanner(id: string): Promise<void> {
    const b = await this.findBanner(id);
    await this.banners.delete(id);
    await this.uploads.remove([b.imageKey, b.imageThumbKey]);
    this.revalidateHome();
  }

  async setBannerImage(id: string, buffer: Buffer, demo = false): Promise<BannerView> {
    const b = await this.findBanner(id);
    const up = await this.uploads.upload(buffer, 'banner', { demo });
    const old = [b.imageKey, b.imageThumbKey];
    b.imageKey = up.largeKey;
    b.imageThumbKey = up.thumbKey;
    await this.banners.save(b);
    await this.uploads.remove(old);
    this.revalidateHome();
    return this.bannerView(b);
  }

  async removeBannerImage(id: string): Promise<BannerView> {
    const b = await this.findBanner(id);
    const old = [b.imageKey, b.imageThumbKey];
    b.imageKey = null;
    b.imageThumbKey = null;
    await this.banners.save(b);
    await this.uploads.remove(old);
    this.revalidateHome();
    return this.bannerView(b);
  }

  // ---------- Secciones destacadas ----------

  async listSections(): Promise<AdminSectionView[]> {
    const rows = await this.sections.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
    const ids = [...new Set(rows.flatMap((s) => s.productIds))];
    const products = ids.length
      ? await this.products.find({ where: { id: In(ids) }, relations: { images: true } })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    return rows.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      productIds: s.productIds,
      products: s.productIds
        .map((pid) => byId.get(pid))
        .filter((p): p is ProductEntity => !!p)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          active: p.active,
          thumbUrl: this.media.url(sortImages(p.images)[0]?.thumbKey),
        })),
      sortOrder: s.sortOrder,
      active: s.active,
    }));
  }

  async activeSections(): Promise<FeaturedSectionEntity[]> {
    return this.sections.find({ where: { active: true }, order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async createSection(dto: CreateSectionDto): Promise<AdminSectionView> {
    await this.assertProducts(dto.productIds);
    const s = await this.sections.save(
      this.sections.create({
        title: dto.title,
        subtitle: dto.subtitle ?? '',
        productIds: dto.productIds,
        sortOrder: dto.sortOrder ?? 0,
        active: dto.active ?? true,
      }),
    );
    this.revalidateHome();
    return this.sectionView(s.id);
  }

  async updateSection(id: string, dto: UpdateSectionDto): Promise<AdminSectionView> {
    const s = await this.sections.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Sección no encontrada.');
    if (dto.productIds) await this.assertProducts(dto.productIds);
    Object.assign(s, Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined)));
    await this.sections.save(s);
    this.revalidateHome();
    return this.sectionView(id);
  }

  async removeSection(id: string): Promise<void> {
    const res = await this.sections.delete(id);
    if (!res.affected) throw new NotFoundException('Sección no encontrada.');
    this.revalidateHome();
  }

  private async sectionView(id: string): Promise<AdminSectionView> {
    const all = await this.listSections();
    return all.find((s) => s.id === id)!;
  }

  private async assertProducts(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const count = await this.products.count({ where: { id: In(ids) } });
    if (count !== ids.length) throw new BadRequestException('Uno o más productos no existen.');
  }

  private async findBanner(id: string): Promise<BannerEntity> {
    const b = await this.banners.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Banner no encontrado.');
    return b;
  }

  private revalidateHome(): void {
    this.revalidation.revalidate([CacheTags.home, CacheTags.banners]);
  }
}
