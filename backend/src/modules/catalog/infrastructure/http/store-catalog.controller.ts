import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '../../../../common/pagination/pagination';
import { BrandsService } from '../../application/brands.service';
import { CatalogQueryService } from '../../application/catalog-query.service';
import { StoreProductsQueryDto } from '../../application/catalog.dto';
import type { BrandView, CategoryNodeView, ProductCardView, ProductDetailView } from '../../application/catalog.views';
import { CategoriesService } from '../../application/categories.service';

@ApiTags('Tienda · Catálogo')
@Controller('store')
export class StoreCatalogController {
  constructor(
    private readonly catalog: CatalogQueryService,
    private readonly categories: CategoriesService,
    private readonly brands: BrandsService,
  ) {}

  @Get('products')
  @ApiOperation({ summary: 'Catálogo: búsqueda, filtros (categoría, marca, precio), orden y paginación' })
  products(@Query() q: StoreProductsQueryDto): Promise<Paginated<ProductCardView>> {
    return this.catalog.search(q);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Detalle de producto con galería, especificaciones y relacionados' })
  product(@Param('slug') slug: string): Promise<ProductDetailView> {
    return this.catalog.detail(slug);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Árbol de categorías activas (un nivel de anidación)' })
  categoriesTree(): Promise<CategoryNodeView[]> {
    return this.categories.tree();
  }

  @Get('brands')
  brandsList(): Promise<BrandView[]> {
    return this.brands.listPublic();
  }

  @Get('filters')
  @ApiOperation({ summary: 'Datos para los filtros del catálogo: categorías, marcas y rango de precios' })
  async filters(): Promise<{ categories: CategoryNodeView[]; brands: BrandView[]; priceRange: { min: number; max: number } }> {
    const [categories, brands, priceRange] = await Promise.all([
      this.categories.tree(),
      this.brands.listPublic(),
      this.catalog.priceRange(),
    ]);
    return { categories, brands, priceRange };
  }

  @Get('sitemap')
  @ApiOperation({ summary: 'Slugs y fechas para sitemap.xml' })
  sitemap() {
    return this.catalog.sitemap();
  }
}
