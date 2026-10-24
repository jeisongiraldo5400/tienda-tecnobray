import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../../../common/security/auth-user';
import { AdminAuth } from '../../../../common/security/roles.decorator';
import { CreateUserDto, UpdateUserDto, type UserView } from '../../application/users.dto';
import { UsersService } from '../../application/users.service';
import { Role } from '../../domain/role';

@ApiTags('Admin · Usuarios')
@AdminAuth(Role.Admin)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del panel (solo admin)' })
  list(): Promise<UserView[]> {
    return this.users.list();
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUserDto): Promise<UserView> {
    return this.users.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar nombre, rol, estado o contraseña' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: AuthUser): Promise<UserView> {
    return this.users.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar usuario' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser): Promise<void> {
    await this.users.remove(id, actor);
  }
}
