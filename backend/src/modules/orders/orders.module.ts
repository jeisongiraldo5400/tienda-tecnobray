import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../catalog/infrastructure/persistence/product.entity';
import { SettingsModule } from '../settings/settings.module';
import { CheckoutService } from './application/checkout.service';
import { CustomersService } from './application/customers.service';
import { OrderMapper } from './application/order-mapper';
import { OrdersAdminService } from './application/orders-admin.service';
import { TrackingService } from './application/tracking.service';
import { AdminOrdersController } from './infrastructure/http/admin-orders.controller';
import { StoreOrdersController } from './infrastructure/http/store-orders.controller';
import { OrderEventEntity } from './infrastructure/persistence/order-event.entity';
import { OrderItemEntity } from './infrastructure/persistence/order-item.entity';
import { OrderEntity } from './infrastructure/persistence/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OrderEventEntity, ProductEntity]), SettingsModule],
  controllers: [StoreOrdersController, AdminOrdersController],
  providers: [CheckoutService, TrackingService, OrdersAdminService, CustomersService, OrderMapper],
})
export class OrdersModule {}
