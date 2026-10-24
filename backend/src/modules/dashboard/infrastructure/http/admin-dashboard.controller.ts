import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import { DashboardService, type DashboardView } from '../../application/dashboard.service';

@ApiTags('Admin · Dashboard')
@AdminAuth()
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Pedidos de hoy/semana, ventas, stock bajo y últimos pedidos' })
  get(): Promise<DashboardView> {
    return this.dashboard.get();
  }
}
