import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from './config/config.module';
import { validateEnv } from './config/env.validation';
import { AppThrottlerGuard } from './common/security/app-throttler.guard';
import { SecurityModule } from './common/security/security.module';
import { buildTypeOrmOptions } from './database/typeorm-options';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ContentModule } from './modules/content/content.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RevalidationModule } from './modules/revalidation/revalidation.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
      // En pruebas e2e todo el entorno lo define test/setup-env.ts (nunca se lee backend/.env).
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    AppConfigModule,
    TypeOrmModule.forRootAsync({ useFactory: () => buildTypeOrmOptions() }),
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }] }),
    SecurityModule,
    StorageModule,
    RevalidationModule,
    HealthModule,
    UsersModule,
    AuthModule,
    SettingsModule,
    CatalogModule,
    ContentModule,
    OrdersModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
