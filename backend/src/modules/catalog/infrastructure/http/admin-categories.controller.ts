import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SingleImageUpload } from '../../../../common/http/upload';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from '../../application/catalog.dto';
import type { AdminCategoryView } from '../../application/catalog.views';
import { CategoriesService } from '../../application/categories.service';

@ApiTags('Admin · Categorías')
@AdminAuth()
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías (planas, con parentId)' })
  list(): Promise<AdminCategoryView[]> {
    return this.categories.listAdmin();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminCategoryView> {
    return this.categories.getAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<AdminCategoryView> {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto): Promise<AdminCategoryView> {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categories.remove(id);
  }

  @Post(':id/image')
  @SingleImageUpload()
  @ApiOperation({ summary: 'Subir/reemplazar imagen de la categoría' })
  setImage(@Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: Express.Multer.File | undefined): Promise<AdminCategoryView> {
    return this.categories.setImage(id, file?.buffer as Buffer);
  }

  @Delete(':id/image')
  @ApiOperation({ summary: 'Quitar imagen de la categoría' })
  removeImage(@Param('id', ParseUUIDPipe) id: string): Promise<AdminCategoryView> {
    return this.categories.removeImage(id);
  }
}
