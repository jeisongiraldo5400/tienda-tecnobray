import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CheckoutService } from '../../application/checkout.service';
import { CheckoutDto, TrackOrderDto } from '../../application/orders.dto';
import type { OrderConfirmationView, TrackingView } from '../../application/orders.views';
import { TrackingService } from '../../application/tracking.service';

@ApiTags('Tienda · Pedidos')
@Controller('store/orders')
export class StoreOrdersController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly tracking: TrackingService,
  ) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'UUID u otro valor único por intento de compra (8-100 caracteres)' })
  @ApiConflictResponse({ description: 'Productos no disponibles (details: [{productId, reason, name, maxQuantity}]) o llave reutilizada' })
  @ApiOperation({ summary: 'Crear pedido (checkout). Precios recalculados en el servidor; sin pasarela de pago.' })
  create(@Body() dto: CheckoutDto, @Headers('idempotency-key') key: string | undefined): Promise<OrderConfirmationView> {
    return this.checkout.placeOrder(dto, key);
  }

  @Post('track')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Seguimiento de pedido por número + teléfono' })
  track(@Body() dto: TrackOrderDto): Promise<TrackingView> {
    return this.tracking.track(dto.number, dto.phone);
  }
}
