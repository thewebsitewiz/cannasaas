import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorResolver } from './two-factor.resolver';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthResolver, TwoFactorService, TwoFactorResolver, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, TwoFactorService],
})
export class AuthModule {}
