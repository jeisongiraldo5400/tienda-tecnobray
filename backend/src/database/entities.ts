import { BrandEntity } from '../modules/catalog/infrastructure/persistence/brand.entity';
import { CategoryEntity } from '../modules/catalog/infrastructure/persistence/category.entity';
import { ProductImageEntity } from '../modules/catalog/infrastructure/persistence/product-image.entity';
import { ProductEntity } from '../modules/catalog/infrastructure/persistence/product.entity';
import { BannerEntity } from '../modules/content/infrastructure/persistence/banner.entity';
import { FeaturedSectionEntity } from '../modules/content/infrastructure/persistence/featured-section.entity';
import { OrderEventEntity } from '../modules/orders/infrastructure/persistence/order-event.entity';
import { OrderItemEntity } from '../modules/orders/infrastructure/persistence/order-item.entity';
import { OrderEntity } from '../modules/orders/infrastructure/persistence/order.entity';
import { PolicyPageEntity } from '../modules/settings/infrastructure/persistence/policy-page.entity';
import { StoreSettingsEntity } from '../modules/settings/infrastructure/persistence/store-settings.entity';
import { RefreshSessionEntity } from '../modules/users/infrastructure/persistence/refresh-session.entity';
import { UserEntity } from '../modules/users/infrastructure/persistence/user.entity';

export const ENTITIES = [
  UserEntity,
  RefreshSessionEntity,
  CategoryEntity,
  BrandEntity,
  ProductEntity,
  ProductImageEntity,
  BannerEntity,
  FeaturedSectionEntity,
  StoreSettingsEntity,
  PolicyPageEntity,
  OrderEntity,
  OrderItemEntity,
  OrderEventEntity,
];
