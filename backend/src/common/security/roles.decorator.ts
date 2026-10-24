import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Role } from '../../modules/users/domain/role';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

export const ROLES_KEY = 'roles';

/**
 * Marca un controlador/handler como ruta del panel: exige sesión (cookie tb_at)
 * y, opcionalmente, uno de los roles indicados. Sin roles = cualquier usuario activo.
 */
export function AdminAuth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiCookieAuth('tb_at'),
    ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' }),
    ApiForbiddenResponse({ description: 'Rol sin permiso o token CSRF inválido' }),
  );
}
