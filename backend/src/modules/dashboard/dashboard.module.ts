import { Module } from '@nestjs/common';
import { DashboardService } from './application/dashboard.service';
import { AdminDashboardController } from './infrastructure/http/admin-dashboard.controller';

@Module({ controllers: [AdminDashboardController], providers: [DashboardService] })
export class DashboardModule {}
