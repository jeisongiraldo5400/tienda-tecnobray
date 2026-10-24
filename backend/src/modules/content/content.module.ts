import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { ProductEntity } from '../catalog/infrastructure/persistence/product.entity';
import { ContentService } from './application/content.service';
import { HomeService } from './application/home.service';
import { AdminContentController } from './infrastructure/http/admin-content.controller';
import { StoreHomeController } from './infrastructure/http/store-home.controller';
import { BannerEntity } from './infrastructure/persistence/banner.entity';
import { FeaturedSectionEntity } from './infrastructure/persistence/featured-section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BannerEntity, FeaturedSectionEntity, ProductEntity]), CatalogModule],
  controllers: [AdminContentController, StoreHomeController],
  providers: [ContentService, HomeService],
  exports: [ContentService],
})
export class ContentModule {}
