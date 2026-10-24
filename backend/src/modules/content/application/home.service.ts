import { Injectable } from '@nestjs/common';
import { CatalogQueryService } from '../../catalog/application/catalog-query.service';
import type { CategoryNodeView, ProductCardView } from '../../catalog/application/catalog.views';
import { CategoriesService } from '../../catalog/application/categories.service';
import type { BannerView } from './content.dto';
import { ContentService } from './content.service';

export interface HomeView {
  banners: BannerView[];
  categories: CategoryNodeView[];
  featured: ProductCardView[];
  newest: ProductCardView[];
  sections: Array<{ id: string; title: string; subtitle: string; products: ProductCardView[] }>;
}

@Injectable()
export class HomeService {
  constructor(
    private readonly content: ContentService,
    private readonly catalog: CatalogQueryService,
    private readonly categories: CategoriesService,
  ) {}

  async home(): Promise<HomeView> {
    const [banners, categories, featured, newest, sections] = await Promise.all([
      this.content.publicBanners(),
      this.categories.tree(),
      this.catalog.featured(8),
      this.catalog.newest(8),
      this.content.activeSections(),
    ]);
    const sectionViews = await Promise.all(
      sections.map(async (s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        products: await this.catalog.byIds(s.productIds),
      })),
    );
    return { banners, categories, featured, newest, sections: sectionViews.filter((s) => s.products.length) };
  }
}
