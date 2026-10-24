import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../modules/users/domain/role';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user as AuthUser;
});
