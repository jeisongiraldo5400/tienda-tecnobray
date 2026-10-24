import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { markdownToSafeHtml } from '../../../common/utils/markdown';
import { MAX_QTY_PER_ITEM } from '../../catalog/domain/stock-policy';
import { CacheTags, RevalidationService } from '../../revalidation/application/revalidation.service';
import { ImageUploadService } from '../../storage/application/image-upload.service';
import { MediaUrlService } from '../../storage/application/media-url.service';
import { POLICY_SLUGS, POLICY_TITLES, type PolicySlug } from '../domain/policy-slugs';
import { PolicyPageEntity } from '../infrastructure/persistence/policy-page.entity';
import { StoreSettingsEntity } from '../infrastructure/persistence/store-settings.entity';
import type {
  AdminSettingsView,
  PolicyPageView,
  PublicSettingsView,
  UpdatePolicyPageDto,
  UpdateSettingsDto,
} from './settings.dto';

const variant = (key: string | null, from: string, to: string) => (key ? key.replace(from, to) : null);

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(StoreSettingsEntity) private readonly settings: Repository<StoreSettingsEntity>,
    @InjectRepository(PolicyPageEntity) private readonly pages: Repository<PolicyPageEntity>,
    private readonly media: MediaUrlService,
    private readonly uploads: ImageUploadService,
    private readonly revalidation: RevalidationService,
  ) {}

  async entity(): Promise<StoreSettingsEntity> {
    let s = await this.settings.findOne({ where: { id: 1 } });
    if (!s) s = await this.settings.save(this.settings.create({ id: 1 }));
    return s;
  }

  private publicView(s: StoreSettingsEntity): PublicSettingsView {
    return {
      storeName: s.storeName,
      tagline: s.tagline,
      logoUrl: this.media.url(s.logoKey),
      logoSmallUrl: this.media.url(variant(s.logoKey, '/512.webp', '/192.webp')),
      faviconUrl: this.media.url(s.faviconKey),
      appleTouchIconUrl: this.media.url(variant(s.faviconKey, '/64.png', '/180.png')),
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
      accentColor: s.accentColor,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      announcement: s.announcement,
      whatsapp: s.whatsapp,
      phone: s.phone,
      email: s.email,
      address: s.address,
      social: Object.fromEntries(Object.entries(s.social ?? {}).filter(([, v]) => !!v)) as Record<string, string>,
      shippingInfo: s.shippingInfo,
      maxQuantityPerItem: MAX_QTY_PER_ITEM,
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  async getPublic(): Promise<PublicSettingsView> {
    return this.publicView(await this.entity());
  }

  async getAdmin(): Promise<AdminSettingsView> {
    const s = await this.entity();
    return { ...this.publicView(s), lowStockThreshold: s.lowStockThreshold };
  }

  async update(dto: UpdateSettingsDto): Promise<AdminSettingsView> {
    const s = await this.entity();
    const { social, ...rest } = dto;
    Object.assign(s, Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
    if (social) s.social = { ...(s.social ?? {}), ...social };
    await this.settings.save(s);
    this.revalidate();
    return this.getAdmin();
  }

  async setLogo(buffer: Buffer, demo = false): Promise<AdminSettingsView> {
    const s = await this.entity();
    const up = await this.uploads.upload(buffer, 'logo', { demo });
    const old = [s.logoKey, variant(s.logoKey, '/512.webp', '/192.webp')];
    s.logoKey = up.largeKey;
    await this.settings.save(s);
    await this.uploads.remove(old);
    this.revalidate();
    return this.getAdmin();
  }

  async setFavicon(buffer: Buffer, demo = false): Promise<AdminSettingsView> {
    const s = await this.entity();
    const up = await this.uploads.upload(buffer, 'favicon', { demo });
    const old = [s.faviconKey, variant(s.faviconKey, '/64.png', '/180.png')];
    s.faviconKey = up.largeKey;
    await this.settings.save(s);
    await this.uploads.remove(old);
    this.revalidate();
    return this.getAdmin();
  }

  async removeLogo(): Promise<AdminSettingsView> {
    const s = await this.entity();
    const old = [s.logoKey, variant(s.logoKey, '/512.webp', '/192.webp')];
    s.logoKey = null;
    await this.settings.save(s);
    await this.uploads.remove(old);
    this.revalidate();
    return this.getAdmin();
  }

  async removeFavicon(): Promise<AdminSettingsView> {
    const s = await this.entity();
    const old = [s.faviconKey, variant(s.faviconKey, '/64.png', '/180.png')];
    s.faviconKey = null;
    await this.settings.save(s);
    await this.uploads.remove(old);
    this.revalidate();
    return this.getAdmin();
  }

  // ---------- Páginas de políticas ----------

  private pageView(p: PolicyPageEntity): PolicyPageView {
    return { slug: p.slug, title: p.title, content: p.content, contentHtml: p.contentHtml, updatedAt: p.updatedAt.toISOString() };
  }

  async listPages(): Promise<PolicyPageView[]> {
    const rows = await this.pages.find();
    const order = new Map(POLICY_SLUGS.map((s, i) => [s as string, i]));
    return rows.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)).map((p) => this.pageView(p));
  }

  async getPage(slug: string): Promise<PolicyPageView> {
    if (!POLICY_SLUGS.includes(slug as PolicySlug)) throw new NotFoundException('Página no encontrada.');
    let p = await this.pages.findOne({ where: { slug } });
    if (!p) p = await this.pages.save(this.pages.create({ slug, title: POLICY_TITLES[slug as PolicySlug] }));
    return this.pageView(p);
  }

  async updatePage(slug: string, dto: UpdatePolicyPageDto): Promise<PolicyPageView> {
    await this.getPage(slug);
    const p = (await this.pages.findOne({ where: { slug } }))!;
    if (dto.title !== undefined) p.title = dto.title;
    if (dto.content !== undefined) {
      p.content = dto.content;
      p.contentHtml = markdownToSafeHtml(dto.content);
    }
    await this.pages.save(p);
    this.revalidation.revalidate([CacheTags.pages, CacheTags.page(slug)]);
    return this.pageView(p);
  }

  private revalidate(): void {
    this.revalidation.revalidate([CacheTags.settings, CacheTags.home]);
  }
}
