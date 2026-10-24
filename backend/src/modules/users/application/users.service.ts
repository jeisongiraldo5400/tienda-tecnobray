import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../../common/security/auth-user';
import { hashPassword } from '../domain/password';
import { Role } from '../domain/role';
import { RefreshSessionEntity } from '../infrastructure/persistence/refresh-session.entity';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import type { CreateUserDto, UpdateUserDto, UserView } from './users.dto';

export function toUserView(u: UserEntity): UserView {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(RefreshSessionEntity) private readonly sessions: Repository<RefreshSessionEntity>,
  ) {}

  async list(): Promise<UserView[]> {
    const rows = await this.users.find({ order: { createdAt: 'ASC' } });
    return rows.map(toUserView);
  }

  async create(dto: CreateUserDto): Promise<UserView> {
    const exists = await this.users.exists({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Ya existe un usuario con ese correo.');
    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash: await hashPassword(dto.password),
      active: true,
    });
    return toUserView(await this.users.save(user));
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser): Promise<UserView> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    const demoting = dto.role !== undefined && dto.role !== Role.Admin && user.role === Role.Admin;
    const deactivating = dto.active === false && user.active;
    if (id === actor.id && (demoting || deactivating)) {
      throw new BadRequestException('No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.');
    }
    if ((demoting || deactivating) && user.role === Role.Admin) await this.assertAnotherActiveAdmin(id);

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password) user.passwordHash = await hashPassword(dto.password);
    await this.users.save(user);
    if (dto.password || deactivating) await this.revokeSessions(id);
    return toUserView(user);
  }

  async remove(id: string, actor: AuthUser): Promise<void> {
    if (id === actor.id) throw new BadRequestException('No puedes eliminar tu propia cuenta.');
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    if (user.role === Role.Admin && user.active) await this.assertAnotherActiveAdmin(id);
    await this.users.delete(id);
  }

  async revokeSessions(userId: string): Promise<void> {
    await this.sessions
      .createQueryBuilder()
      .update()
      .set({ revokedAt: () => 'now()' })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();
  }

  private async assertAnotherActiveAdmin(excludeId: string): Promise<void> {
    const count = await this.users
      .createQueryBuilder('u')
      .where('u.role = :role AND u.active = true AND u.id <> :id', { role: Role.Admin, id: excludeId })
      .getCount();
    if (count === 0) throw new BadRequestException('Debe quedar al menos un administrador activo.');
  }
}
