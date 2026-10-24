import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SingleImageUpload } from '../../../../common/http/upload';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import {
  CreateBannerDto,
  CreateSectionDto,
  UpdateBannerDto,
  UpdateSectionDto,
  type AdminSectionView,
  type BannerView,
} from '../../application/content.dto';
import { ContentService } from '../../application/content.service';

@ApiTags('Admin · Contenido del inicio')
@AdminAuth()
@Controller('admin')
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get('banners')
  @ApiOperation({ summary: 'Listar banners del slider' })
  listBanners(): Promise<BannerView[]> {
    return this.content.listBanners();
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto): Promise<BannerView> {
    return this.content.createBanner(dto);
  }

  @Patch('banners/:id')
  updateBanner(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBannerDto): Promise<BannerView> {
    return this.content.updateBanner(id, dto);
  }

  @Delete('banners/:id')
  @HttpCode(204)
  async removeBanner(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.content.removeBanner(id);
  }

  @Post('banners/:id/image')
  @SingleImageUpload()
  @ApiOperation({ summary: 'Subir/reemplazar imagen del banner (WebP 1920px + 640px)' })
  setBannerImage(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File | undefined): Promise<BannerView> {
    return this.content.setBannerImage(id, file?.buffer as Buffer);
  }

  @Delete('banners/:id/image')
  @ApiOperation({ summary: 'Quitar imagen del banner (borra los objetos en S3; el banner deja de mostrarse)' })
  removeBannerImage(@Param('id', ParseUUIDPipe) id: string): Promise<BannerView> {
    return this.content.removeBannerImage(id);
  }

  @Get('sections')
  @ApiOperation({ summary: 'Listar secciones destacadas del inicio' })
  listSections(): Promise<AdminSectionView[]> {
    return this.content.listSections();
  }

  @Post('sections')
  createSection(@Body() dto: CreateSectionDto): Promise<AdminSectionView> {
    return this.content.createSection(dto);
  }

  @Patch('sections/:id')
  updateSection(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSectionDto): Promise<AdminSectionView> {
    return this.content.updateSection(id, dto);
  }

  @Delete('sections/:id')
  @HttpCode(204)
  async removeSection(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.content.removeSection(id);
  }
}
