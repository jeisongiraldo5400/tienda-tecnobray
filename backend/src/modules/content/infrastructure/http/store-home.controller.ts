import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService, type HomeView } from '../../application/home.service';

@ApiTags('Tienda · Inicio')
@Controller('store')
export class StoreHomeController {
  constructor(private readonly home: HomeService) {}

  @Get('home')
  @ApiOperation({ summary: 'Datos del inicio: banners, categorías, destacados, novedades y secciones' })
  get(): Promise<HomeView> {
    return this.home.home();
  }
}
