import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination';
import { SLUG_REGEX } from '../../../common/utils/slug';
import { EmptyToNull, QueryBool, Trim } from '../../../common/utils/transforms';

const MAX_PRICE = 1_000_000_000;

export class SpecDto {
  @ApiProperty({ example: 'Pantalla' })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  key: string;

  @ApiProperty({ example: '6,5" AMOLED 120 Hz' })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  value: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Celular Nova X 128 GB' })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Se genera desde el nombre si se omite' })
  @IsOptional()
  @Trim()
  @Matches(SLUG_REGEX, { message: 'El slug solo admite minúsculas, números y guiones' })
  @MaxLength(220)
  slug?: string;

  @ApiProperty({ example: 'TB-CEL-001' })
  @Trim()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]{2,64}$/, { message: 'SKU inválido (letras, números, punto, guion)' })
  sku: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsUUID()
  brandId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Markdown; se convierte a HTML sanitizado' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiProperty({ description: 'Precio final en COP (entero)', example: 1299900 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  @ApiPropertyOptional({ nullable: true, description: 'Precio anterior (tachado); debe ser mayor que price' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  compareAtPrice?: number | null;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stock: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ type: [SpecDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => SpecDto)
  specs?: SpecDto[];

  @ApiPropertyOptional({ maxLength: 70, nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(70)
  seoTitle?: string | null;

  @ApiPropertyOptional({ maxLength: 170, nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(170)
  seoDescription?: string | null;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class AdminProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca en nombre y SKU' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @QueryBool()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @QueryBool()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Solo productos con stock <= umbral de configuración' })
  @IsOptional()
  @QueryBool()
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ enum: ['newest', 'oldest', 'name', 'price_asc', 'price_desc', 'stock_asc'] })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'name', 'price_asc', 'price_desc', 'stock_asc'])
  sort?: string;
}

export const STORE_SORTS = ['relevance', 'newest', 'price_asc', 'price_desc', 'name'] as const;

export class StoreProductsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  page: number = 1;

  @ApiPropertyOptional({ default: 24, maximum: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize: number = 24;

  @ApiPropertyOptional({ description: 'Texto de búsqueda (nombre, SKU, marca)' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Slug de categoría (incluye subcategorías)' })
  @IsOptional()
  @Matches(SLUG_REGEX)
  category?: string;

  @ApiPropertyOptional({ description: 'Slug(s) de marca separados por coma' })
  @IsOptional()
  @Matches(/^[a-z0-9-]+(,[a-z0-9-]+){0,19}$/)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Solo productos disponibles' })
  @IsOptional()
  @QueryBool()
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Solo destacados' })
  @IsOptional()
  @QueryBool()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: STORE_SORTS, default: 'relevance' })
  @IsOptional()
  @IsIn(STORE_SORTS)
  sort?: (typeof STORE_SORTS)[number];
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Celulares' })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @Matches(SLUG_REGEX, { message: 'El slug solo admite minúsculas, números y guiones' })
  @MaxLength(140)
  slug?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Categoría padre (solo un nivel)' })
  @IsOptional()
  @EmptyToNull()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateBrandDto {
  @ApiProperty({ example: 'Nova' })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @Matches(SLUG_REGEX)
  @MaxLength(140)
  slug?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class ReorderImagesDto {
  @ApiProperty({ type: [String], description: 'IDs de imágenes en el nuevo orden' })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(30)
  @IsUUID('all', { each: true })
  imageIds: string[];
}

export class UpdateImageDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  alt?: string;

  @ApiPropertyOptional({ description: 'true para marcarla como principal' })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
