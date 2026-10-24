import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Paginated } from '../../../../common/pagination/pagination';
import { CurrentUser, type AuthUser } from '../../../../common/security/auth-user';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import { CustomersService } from '../../application/customers.service';
import { AddNoteDto, AdminOrdersQueryDto, ChangeStatusDto, CustomersQueryDto } from '../../application/orders.dto';
import type { AdminOrderDetail, AdminOrderListItem, CustomerView } from '../../application/orders.views';
import { OrdersAdminService } from '../../application/orders-admin.service';

@ApiTags('Admin · Pedidos y clientes')
@AdminAuth()
@Controller('admin')
export class AdminOrdersController {
  constructor(
    private readonly orders: OrdersAdminService,
    private readonly customers: CustomersService,
  ) {}

  @Get('orders')
  @ApiOperation({ summary: 'Listar pedidos (búsqueda, estado, rango de fechas)' })
  list(@Query() q: AdminOrdersQueryDto): Promise<Paginated<AdminOrderListItem>> {
    return this.orders.list(q);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Detalle del pedido con historial y transiciones permitidas' })
  detail(@Param('id', ParseUUIDPipe) id: string): Promise<AdminOrderDetail> {
    return this.orders.detail(id);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Cambiar estado (confirmar descuenta stock; cancelar lo repone)' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<AdminOrderDetail> {
    return this.orders.changeStatus(id, dto.status, dto.note, user);
  }

  @Post('orders/:id/notes')
  @ApiOperation({ summary: 'Agregar nota interna al historial' })
  addNote(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddNoteDto, @CurrentUser() user: AuthUser): Promise<AdminOrderDetail> {
    return this.orders.addNote(id, dto.note, user);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Clientes derivados de los pedidos (agrupados por teléfono)' })
  listCustomers(@Query() q: CustomersQueryDto): Promise<Paginated<CustomerView>> {
    return this.customers.list(q);
  }
}
