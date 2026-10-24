import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination';
import { EmptyToNull, Trim } from '../../../common/utils/transforms';
import { MAX_QTY_PER_ITEM } from '../../catalog/domain/stock-policy';
import { OrderStatus } from '../domain/order-status';

export const PHONE_REGEX = /^[0-9+()\s-]{7,20}$/;

export class CheckoutItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1, maximum: MAX_QTY_PER_ITEM })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_ITEM)
  quantity: number;
}

export class CheckoutCustomerDto {
  @ApiProperty({ example: 'Camila Restrepo' })
  @Trim()
  @IsString()
  @MinLength(3, { message: 'Escribe tu nombre completo' })
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: '300 123 4567' })
  @Trim()
  @Matches(PHONE_REGEX, { message: 'Teléfono inválido' })
  phone: string;

  @ApiPropertyOptional({ example: 'camila@correo.com', nullable: true })
  @IsOptional()
  @EmptyToNull()
  @ValidateIf((o: CheckoutCustomerDto) => o.email !== null)
  @IsEmail({}, { message: 'Correo inválido' })
  @MaxLength(160)
  email?: string | null;

  @ApiProperty({ example: 'Medellín' })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city: string;

  @ApiProperty({ example: 'Cra 43A # 1-50, apto 301' })
  @Trim()
  @IsString()
  @MinLength(5, { message: 'Escribe la dirección completa' })
  @MaxLength(250)
  address: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class CheckoutDto {
  @ApiProperty({ type: CheckoutCustomerDto })
  @ValidateNested()
  @Type(() => CheckoutCustomerDto)
  customer: CheckoutCustomerDto;

  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'El carrito está vacío' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}

export class TrackOrderDto {
  @ApiProperty({ example: 'TB-001001' })
  @Trim()
  @Matches(/^TB-?\d{4,10}$/i, { message: 'Número de pedido inválido' })
  number: string;

  @ApiProperty({ example: '3001234567' })
  @Trim()
  @Matches(PHONE_REGEX, { message: 'Teléfono inválido' })
  phone: string;
}

export class AdminOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Número, nombre, teléfono o correo' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Desde (YYYY-MM-DD, hora Colombia)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Hasta inclusive (YYYY-MM-DD, hora Colombia)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ChangeStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @EmptyToNull()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}

export class AddNoteDto {
  @ApiProperty({ maxLength: 1000 })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note: string;
}

export class CustomersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Nombre, teléfono o correo' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  q?: string;
}
