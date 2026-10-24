import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Trim } from '../../../common/utils/transforms';

const HEX = /^#[0-9A-Fa-f]{6}$/;
const HTTPS_OR_EMPTY = /^(https:\/\/[^\s]+)?$/;

export class SocialLinksDto {
  @ApiPropertyOptional() @IsOptional() @Trim() @Matches(HTTPS_OR_EMPTY, { message: 'URL https inválida' }) @MaxLength(300) facebook?: string;
  @ApiPropertyOptional() @IsOptional() @Trim() @Matches(HTTPS_OR_EMPTY, { message: 'URL https inválida' }) @MaxLength(300) instagram?: string;
  @ApiPropertyOptional() @IsOptional() @Trim() @Matches(HTTPS_OR_EMPTY, { message: 'URL https inválida' }) @MaxLength(300) tiktok?: string;
  @ApiPropertyOptional() @IsOptional() @Trim() @Matches(HTTPS_OR_EMPTY, { message: 'URL https inválida' }) @MaxLength(300) youtube?: string;
  @ApiPropertyOptional() @IsOptional() @Trim() @Matches(HTTPS_OR_EMPTY, { message: 'URL https inválida' }) @MaxLength(300) x?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'TecnoBray' })
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  storeName?: string;

  @ApiPropertyOptional({ example: 'Tecnología con garantía y envío a toda Colombia' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(160)
  tagline?: string;

  @ApiPropertyOptional({ example: '#0B1E3F', description: 'Color principal (azul marino de la marca)' })
  @IsOptional()
  @Matches(HEX, { message: 'Color inválido (formato #RRGGBB)' })
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#071630', description: 'Color secundario (pie de página, barra de anuncio)' })
  @IsOptional()
  @Matches(HEX, { message: 'Color inválido (formato #RRGGBB)' })
  secondaryColor?: string;

  @ApiPropertyOptional({ example: '#84C43A', description: 'Color de acento (botones de compra, descuentos)' })
  @IsOptional()
  @Matches(HEX, { message: 'Color inválido (formato #RRGGBB)' })
  accentColor?: string;

  @ApiPropertyOptional({ maxLength: 70, description: 'Título SEO del inicio (vacío = valor por defecto)' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(70)
  seoTitle?: string;

  @ApiPropertyOptional({ maxLength: 170 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(170)
  seoDescription?: string;

  @ApiPropertyOptional({ maxLength: 200, description: 'Barra de anuncios (vacío = oculta)' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  announcement?: string;

  @ApiPropertyOptional({ example: '573001234567', description: 'Solo dígitos, con indicativo de país' })
  @IsOptional()
  @Matches(/^(\d{10,15})?$/, { message: 'WhatsApp: solo dígitos con indicativo (ej. 573001234567)' })
  whatsapp?: string;

  @ApiPropertyOptional({ example: '+57 604 444 0000' })
  @IsOptional()
  @Trim()
  @Matches(/^[0-9+()\s-]{0,30}$/, { message: 'Teléfono inválido' })
  phone?: string;

  @ApiPropertyOptional({ example: 'hola@tecnobray.co' })
  @IsOptional()
  @Trim()
  @ValidateIf((o: UpdateSettingsDto) => !!o.email)
  @IsEmail({}, { message: 'Correo inválido' })
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(250)
  address?: string;

  @ApiPropertyOptional({ type: SocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  social?: SocialLinksDto;

  @ApiPropertyOptional({ description: 'Texto corto de envíos que se muestra en producto y checkout' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  shippingInfo?: string;

  @ApiPropertyOptional({ description: 'Umbral de stock bajo para el dashboard', default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  lowStockThreshold?: number;
}

export class UpdatePolicyPageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ description: 'Contenido en Markdown (se sanitiza)' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;
}

export interface PublicSettingsView {
  storeName: string;
  tagline: string;
  logoUrl: string | null;
  logoSmallUrl: string | null;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  announcement: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  social: Record<string, string>;
  shippingInfo: string;
  maxQuantityPerItem: number;
  updatedAt: string;
}

export interface AdminSettingsView extends PublicSettingsView {
  lowStockThreshold: number;
}

export interface PolicyPageView {
  slug: string;
  title: string;
  content: string;
  contentHtml: string;
  updatedAt: string;
}
