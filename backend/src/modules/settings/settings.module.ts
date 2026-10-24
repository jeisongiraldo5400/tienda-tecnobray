import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './application/settings.service';
import { AdminSettingsController } from './infrastructure/http/admin-settings.controller';
import { StoreSettingsController } from './infrastructure/http/store-settings.controller';
import { PolicyPageEntity } from './infrastructure/persistence/policy-page.entity';
import { StoreSettingsEntity } from './infrastructure/persistence/store-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoreSettingsEntity, PolicyPageEntity])],
  controllers: [AdminSettingsController, StoreSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
