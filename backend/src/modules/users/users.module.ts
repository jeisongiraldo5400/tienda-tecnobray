import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './application/users.service';
import { AdminUsersController } from './infrastructure/http/admin-users.controller';
import { RefreshSessionEntity } from './infrastructure/persistence/refresh-session.entity';
import { UserEntity } from './infrastructure/persistence/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RefreshSessionEntity])],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
