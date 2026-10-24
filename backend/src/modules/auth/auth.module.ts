import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { RefreshSessionEntity } from '../users/infrastructure/persistence/refresh-session.entity';
import { UserEntity } from '../users/infrastructure/persistence/user.entity';
import { AuthService } from './application/auth.service';
import { LoginAttemptsService } from './application/login-attempts.service';
import { AuthController } from './infrastructure/http/auth.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RefreshSessionEntity]), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, LoginAttemptsService],
})
export class AuthModule {}
