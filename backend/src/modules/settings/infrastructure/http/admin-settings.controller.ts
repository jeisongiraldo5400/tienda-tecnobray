import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SingleImageUpload } from '../../../../common/http/upload';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import { Role } from '../../../users/domain/role';
import { POLICY_SLUGS } from '../../domain/policy-slugs';
import {
  UpdatePolicyPageDto,
  UpdateSettingsDto,
  type AdminSettingsView,
  type PolicyPageView,
} from '../../application/settings.dto';
import { SettingsService } from '../../application/settings.service';

@ApiTags('Admin · Configuración')
@Controller('admin')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings')
  @AdminAuth()
  @ApiOperation({ summary: 'Configuración de la tienda' })
  get(): Promise<AdminSettingsView> {
    return this.settings.getAdmin();
  }

  @Patch('settings')
  @AdminAuth(Role.Admin)
  @ApiOperation({ summary: 'Actualizar configuración (solo admin)' })
  update(@Body() dto: UpdateSettingsDto): Promise<AdminSettingsView> {
    return this.settings.update(dto);
  }

  @Post('settings/logo')
  @AdminAuth(Role.Admin)
  @SingleImageUpload()
  @ApiOperation({ summary: 'Subir logo (WebP 512px + 192px)' })
  logo(@UploadedFile() file: Express.Multer.File | undefined): Promise<AdminSettingsView> {
    return this.settings.setLogo(file?.buffer as Buffer);
  }

  @Delete('settings/logo')
  @AdminAuth(Role.Admin)
  @ApiOperation({ summary: 'Quitar logo (borra los objetos en S3)' })
  removeLogo(): Promise<AdminSettingsView> {
    return this.settings.removeLogo();
  }

  @Post('settings/favicon')
  @AdminAuth(Role.Admin)
  @SingleImageUpload()
  @ApiOperation({ summary: 'Subir favicon (PNG 64px + 180px apple-touch-icon)' })
  favicon(@UploadedFile() file: Express.Multer.File | undefined): Promise<AdminSettingsView> {
    return this.settings.setFavicon(file?.buffer as Buffer);
  }

  @Delete('settings/favicon')
  @AdminAuth(Role.Admin)
  @ApiOperation({ summary: 'Quitar favicon (borra los objetos en S3)' })
  removeFavicon(): Promise<AdminSettingsView> {
    return this.settings.removeFavicon();
  }

  @Get('pages')
  @AdminAuth()
  @ApiOperation({ summary: 'Páginas de políticas (envíos, garantías, devoluciones, privacidad, términos)' })
  pages(): Promise<PolicyPageView[]> {
    return this.settings.listPages();
  }

  @Get('pages/:slug')
  @AdminAuth()
  @ApiParam({ name: 'slug', enum: POLICY_SLUGS })
  page(@Param('slug') slug: string): Promise<PolicyPageView> {
    return this.settings.getPage(slug);
  }

  @Patch('pages/:slug')
  @AdminAuth(Role.Admin)
  @ApiParam({ name: 'slug', enum: POLICY_SLUGS })
  @ApiOperation({ summary: 'Editar página de política (Markdown)' })
  updatePage(@Param('slug') slug: string, @Body() dto: UpdatePolicyPageDto): Promise<PolicyPageView> {
    return this.settings.updatePage(slug, dto);
  }
}
