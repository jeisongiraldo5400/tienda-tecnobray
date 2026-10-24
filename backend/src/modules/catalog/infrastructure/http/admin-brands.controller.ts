import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SingleImageUpload } from '../../../../common/http/upload';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import { BrandsService } from '../../application/brands.service';
import { CreateBrandDto, UpdateBrandDto } from '../../application/catalog.dto';
import type { AdminBrandView } from '../../application/catalog.views';

@ApiTags('Admin · Marcas')
@AdminAuth()
@Controller('admin/brands')
export class AdminBrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  list(): Promise<AdminBrandView[]> {
    return this.brands.listAdmin();
  }

  @Post()
  create(@Body() dto: CreateBrandDto): Promise<AdminBrandView> {
    return this.brands.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto): Promise<AdminBrandView> {
    return this.brands.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.brands.remove(id);
  }

  @Post(':id/logo')
  @SingleImageUpload()
  @ApiOperation({ summary: 'Subir/reemplazar logo de la marca' })
  setLogo(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File | undefined): Promise<AdminBrandView> {
    return this.brands.setLogo(id, file?.buffer as Buffer);
  }

  @Delete(':id/logo')
  @ApiOperation({ summary: 'Quitar logo de la marca (borra los objetos en S3)' })
  removeLogo(@Param('id', ParseUUIDPipe) id: string): Promise<AdminBrandView> {
    return this.brands.removeLogo(id);
  }
}
