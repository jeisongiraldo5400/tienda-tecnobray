import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { POLICY_SLUGS } from '../../domain/policy-slugs';
import type { PolicyPageView, PublicSettingsView } from '../../application/settings.dto';
import { SettingsService } from '../../application/settings.service';

@ApiTags('Tienda · Configuración y páginas')
@Controller('store')
export class StoreSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Configuración pública: nombre, logo, colores, contacto, redes, envíos' })
  get(): Promise<PublicSettingsView> {
    return this.settings.getPublic();
  }

  @Get('pages')
  @ApiOperation({ summary: 'Listado de páginas de políticas' })
  async pages(): Promise<Array<{ slug: string; title: string; updatedAt: string }>> {
    return (await this.settings.listPages()).map(({ slug, title, updatedAt }) => ({ slug, title, updatedAt }));
  }

  @Get('pages/:slug')
  @ApiParam({ name: 'slug', enum: POLICY_SLUGS })
  @ApiOperation({ summary: 'Página de política (HTML sanitizado en contentHtml)' })
  page(@Param('slug') slug: string): Promise<PolicyPageView> {
    return this.settings.getPage(slug);
  }
}
