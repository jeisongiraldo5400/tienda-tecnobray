import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EmptyToNull, Trim } from '../../../common/utils/transforms';

/** Enlace interno (/ruta) o externo https. */
export const LINK_REGEX = /^(\/[^\s]*|https:\/\/[^\s]+)$/;

export class CreateBannerDto {
  @ApiProperty({ example: 'Nuevos celulares 5G' })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'Hasta 12 cuotas y envío a todo Colombia' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  text?: string;

  @ApiPropertyOptional({ example: '/productos?categoria=celulares', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @Matches(LINK_REGEX, { message: 'El enlace debe ser una ruta interna (/...) o una URL https' })
  @MaxLength(500)
  linkUrl?: string | null;

  @ApiPropertyOptional({ example: 'Ver ofertas', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(40)
  buttonText?: string | null;

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

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}

export class CreateSectionDto {
  @ApiProperty({ example: 'Lo más vendido' })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiProperty({ type: [String], description: 'IDs de productos en orden (máx. 24)' })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(24)
  @IsUUID('all', { each: true })
  productIds: string[];

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

export class UpdateSectionDto extends PartialType(CreateSectionDto) {}

export interface BannerView {
  id: string;
  title: string;
  text: string;
  linkUrl: string | null;
  buttonText: string | null;
  imageUrl: string | null;
  thumbUrl: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AdminSectionView {
  id: string;
  title: string;
  subtitle: string;
  productIds: string[];
  products: Array<{ id: string; name: string; sku: string; thumbUrl: string | null; active: boolean }>;
  sortOrder: number;
  active: boolean;
}
