import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { APP_CONFIG } from '../../../config/config.module';
import type { AppConfig } from '../../../config/app-config';
import type { AccessTokenPayload, AuthUser } from '../../../common/security/auth-user';
import { randomToken, safeEqual } from '../../../common/utils/hash';
import { toUserView, UsersService } from '../../users/application/users.service';
import type { UserView } from '../../users/application/users.dto';
import { hashPassword, verifyAgainstDummy, verifyPassword } from '../../users/domain/password';
import { RefreshSessionEntity } from '../../users/infrastructure/persistence/refresh-session.entity';
import { UserEntity } from '../../users/infrastructure/persistence/user.entity';
import { LoginAttemptsService } from './login-attempts.service';

export interface IssuedTokens {
  user: UserView;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

const INVALID = 'Correo o contraseña incorrectos.';

/**
 * Sesiones:
 * - Access token: JWT HS256 (15 min por defecto) en cookie httpOnly `tb_at`.
 * - Refresh token: opaco `<sessionId>.<secreto>` en cookie httpOnly `tb_rt` (path /api/auth).
 *   En BD solo se guarda HMAC-SHA256(JWT_REFRESH_SECRET, secreto). Se rota en cada uso;
 *   si se presenta un token ya rotado/revocado se revocan todas las sesiones del usuario.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RefreshSessionEntity) private readonly sessions: Repository<RefreshSessionEntity>,
    private readonly jwt: JwtService,
    private readonly attempts: LoginAttemptsService,
    private readonly usersService: UsersService,
    @Inject(APP_CONFIG) private readonly cfg: AppConfig,
  ) {}

  async login(email: string, password: string, userAgent?: string): Promise<IssuedTokens> {
    this.attempts.assertNotLocked(email);
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
    const ok = user ? await verifyPassword(password, user.passwordHash) : await verifyAgainstDummy(password);
    if (!user || !ok || !user.active) {
      this.attempts.registerFailure(email);
      throw new UnauthorizedException(INVALID);
    }
    this.attempts.reset(email);
    user.lastLoginAt = new Date();
    await this.users.update(user.id, { lastLoginAt: user.lastLoginAt });
    return this.issue(user, userAgent);
  }

  async refresh(rawToken: string | undefined, userAgent?: string): Promise<IssuedTokens> {
    const parsed = this.parseRefresh(rawToken);
    if (!parsed) throw new UnauthorizedException('Sesión inválida. Inicia sesión de nuevo.');
    const session = await this.sessions.findOne({ where: { id: parsed.id } });
    if (!session || !safeEqual(session.tokenHash, this.hmac(parsed.secret))) {
      throw new UnauthorizedException('Sesión inválida. Inicia sesión de nuevo.');
    }
    if (session.revokedAt) {
      // Reutilización de un token rotado: posible robo → cerrar todas las sesiones.
      await this.usersService.revokeSessions(session.userId);
      throw new UnauthorizedException('Sesión inválida. Inicia sesión de nuevo.');
    }
    if (session.expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('Tu sesión expiró.');
    const user = await this.users.findOne({ where: { id: session.userId } });
    if (!user || !user.active) throw new UnauthorizedException('Usuario inactivo.');
    const res = await this.sessions.update({ id: session.id, revokedAt: IsNull() }, { revokedAt: new Date() });
    if (!res.affected) throw new UnauthorizedException('Sesión inválida. Inicia sesión de nuevo.');
    return this.issue(user, userAgent);
  }

  async logout(rawToken: string | undefined): Promise<void> {
    const parsed = this.parseRefresh(rawToken);
    if (!parsed) return;
    await this.sessions.update({ id: parsed.id, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async me(userId: string): Promise<UserView> {
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    return toUserView(user);
  }

  async changePassword(actor: AuthUser, current: string, next: string): Promise<void> {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: actor.id })
      .getOneOrFail();
    if (!(await verifyPassword(current, user.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }
    await this.users.update(user.id, { passwordHash: await hashPassword(next) });
    await this.usersService.revokeSessions(user.id);
  }

  private async issue(user: UserEntity, userAgent?: string): Promise<IssuedTokens> {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.cfg.jwt.accessSecret,
      expiresIn: this.cfg.jwt.accessTtlSeconds,
      algorithm: 'HS256',
    });
    const secret = randomToken(32);
    const refreshExpiresAt = new Date(Date.now() + this.cfg.jwt.refreshTtlDays * 24 * 3600 * 1000);
    const session = await this.sessions.save(
      this.sessions.create({
        userId: user.id,
        tokenHash: this.hmac(secret),
        expiresAt: refreshExpiresAt,
        userAgent: userAgent?.slice(0, 255) ?? null,
      }),
    );
    return { user: toUserView(user), accessToken, refreshToken: `${session.id}.${secret}`, refreshExpiresAt };
  }

  private hmac(secret: string): string {
    return createHmac('sha256', this.cfg.jwt.refreshSecret).update(secret).digest('hex');
  }

  private parseRefresh(raw: string | undefined): { id: string; secret: string } | null {
    if (!raw) return null;
    const m = /^([0-9a-f-]{36})\.([A-Za-z0-9_-]{20,100})$/.exec(raw);
    return m ? { id: m[1], secret: m[2] } : null;
  }
}
