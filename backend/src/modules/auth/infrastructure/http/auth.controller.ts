import { Body, Controller, Get, HttpCode, Inject, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { APP_CONFIG } from '../../../../config/config.module';
import type { AppConfig } from '../../../../config/app-config';
import { CurrentUser, type AuthUser } from '../../../../common/security/auth-user';
import {
  clearAuthCookies,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  setAuthCookies,
  setCsrfCookie,
} from '../../../../common/security/cookies';
import { JwtAuthGuard } from '../../../../common/security/jwt-auth.guard';
import { randomToken } from '../../../../common/utils/hash';
import type { UserView } from '../../../users/application/users.dto';
import { ChangePasswordDto, LoginDto } from '../../application/auth.dto';
import { AuthService } from '../../application/auth.service';

const CSRF_DOC = { name: 'X-CSRF-Token', description: 'Valor de la cookie tb_csrf (double-submit)', required: true };

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  @Get('csrf')
  @ApiOperation({ summary: 'Obtiene (o renueva) el token CSRF; también lo deja en la cookie tb_csrf' })
  csrf(@Req() req: Request, @Res({ passthrough: true }) res: Response): { csrfToken: string } {
    const existing = req.cookies?.[CSRF_COOKIE] as string | undefined;
    const token = existing && /^[A-Za-z0-9_-]{32,64}$/.test(existing) ? existing : randomToken(24);
    setCsrfCookie(res, this.cfg, token);
    return { csrfToken: token };
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiHeader(CSRF_DOC)
  @ApiOperation({ summary: 'Inicia sesión: deja cookies tb_at (access JWT) y tb_rt (refresh)' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ user: UserView }> {
    const t = await this.auth.login(dto.email, dto.password, req.headers['user-agent']);
    setAuthCookies(res, this.cfg, t.accessToken, t.refreshToken, t.refreshExpiresAt);
    setCsrfCookie(res, this.cfg, randomToken(24));
    return { user: t.user };
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiHeader(CSRF_DOC)
  @ApiOperation({ summary: 'Rota la sesión usando la cookie tb_rt; renueva tb_at y tb_rt' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ user: UserView }> {
    try {
      const t = await this.auth.refresh(req.cookies?.[REFRESH_COOKIE] as string | undefined, req.headers['user-agent']);
      setAuthCookies(res, this.cfg, t.accessToken, t.refreshToken, t.refreshExpiresAt);
      return { user: t.user };
    } catch (err) {
      clearAuthCookies(res, this.cfg);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(204)
  @ApiHeader(CSRF_DOC)
  @ApiOperation({ summary: 'Cierra la sesión y borra las cookies' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    clearAuthCookies(res, this.cfg);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('tb_at')
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  me(@CurrentUser() user: AuthUser): Promise<UserView> {
    return this.auth.me(user.id);
  }

  @Patch('password')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('tb_at')
  @ApiHeader(CSRF_DOC)
  @ApiOperation({ summary: 'Cambiar la contraseña propia (cierra las demás sesiones)' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.auth.changePassword(user, dto.currentPassword, dto.newPassword);
    clearAuthCookies(res, this.cfg);
  }
}
