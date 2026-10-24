import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '../../../../common/pagination/pagination';
import { MultiImageUpload } from '../../../../common/http/upload';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import {
  AdminProductsQueryDto,
  CreateProductDto,
  ReorderImagesDto,
  UpdateImageDto,
  UpdateProductDto,
} from '../../application/catalog.dto';
import type { AdminProductImageView, AdminProductView } from '../../application/catalog.views';
import { ProductsService } from '../../application/products.service';

@ApiTags('Admin · Productos')
@AdminAuth()
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos (filtros, búsqueda, paginación)' })
  list(@Query() q: AdminProductsQueryDto): Promise<Paginated<AdminProductView>> {
    return this.products.list(q);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminProductView> {
    return this.products.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  create(@Body() dto: CreateProductDto): Promise<AdminProductView> {
    return this.products.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto (parcial)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto): Promise<AdminProductView> {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar producto y sus imágenes en S3' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.products.remove(id);
  }

  @Post(':id/images')
  @MultiImageUpload()
  @ApiOperation({ summary: 'Subir imágenes (genera WebP 1600px y miniatura 400px en S3)' })
  addImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
  ): Promise<AdminProductImageView[]> {
    return this.products.addImages(id, (files ?? []).map((f) => f.buffer));
  }

  @Patch(':id/images/reorder')
  @ApiOperation({ summary: 'Reordenar imágenes' })
  reorder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderImagesDto): Promise<AdminProductImageView[]> {
    return this.products.reorderImages(id, dto.imageIds);
  }

  @Patch(':id/images/:imageId')
  @ApiOperation({ summary: 'Editar texto alternativo o marcar como principal' })
  updateImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: UpdateImageDto,
  ): Promise<AdminProductImageView[]> {
    return this.products.updateImage(id, imageId, dto);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Eliminar imagen (también borra los objetos en S3)' })
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<AdminProductImageView[]> {
    return this.products.removeImage(id, imageId);
  }
}
