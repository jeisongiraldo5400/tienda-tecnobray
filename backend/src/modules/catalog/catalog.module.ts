import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreSettingsEntity } from '../settings/infrastructure/persistence/store-settings.entity';
import { BrandsService } from './application/brands.service';
import { CatalogQueryService } from './application/catalog-query.service';
import { CatalogMapper } from './application/catalog.mappers';
import { CategoriesService } from './application/categories.service';
import { ProductsService } from './application/products.service';
import { AdminBrandsController } from './infrastructure/http/admin-brands.controller';
import { AdminCategoriesController } from './infrastructure/http/admin-categories.controller';
import { AdminProductsController } from './infrastructure/http/admin-products.controller';
import { StoreCatalogController } from './infrastructure/http/store-catalog.controller';
import { BrandEntity } from './infrastructure/persistence/brand.entity';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { ProductImageEntity } from './infrastructure/persistence/product-image.entity';
import { ProductEntity } from './infrastructure/persistence/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ProductImageEntity, CategoryEntity, BrandEntity, StoreSettingsEntity]),
  ],
  controllers: [AdminProductsController, AdminCategoriesController, AdminBrandsController, StoreCatalogController],
  providers: [CatalogMapper, ProductsService, CategoriesService, BrandsService, CatalogQueryService],
  exports: [CatalogMapper, ProductsService, CategoriesService, BrandsService, CatalogQueryService],
})
export class CatalogModule {}
