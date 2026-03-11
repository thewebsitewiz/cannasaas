import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokenRepo: Repository<RefreshToken>,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterInput, meta?: { userAgent?: string; ipAddress?: string }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      role: Role.CUSTOMER,
    });
    await this.userRepo.save(user);
    return this.generateTokens(user, meta);
  }

  async login(dto: LoginInput, meta?: { userAgent?: string; ipAddress?: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account disabled');

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    return this.generateTokens(user, meta);
  }

  async refresh(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.tokenRepo.findOne({
      where: { userId, tokenHash, isRevoked: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.tokenRepo.update(stored.id, { isRevoked: true, revokedAt: new Date() });
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return this.generateTokens(user);
  }

  async logout(userId: string, rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.tokenRepo.update({ userId, tokenHash }, { isRevoked: true, revokedAt: new Date() });
  }

  async logoutAll(userId: string) {
    await this.tokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
  }

  private async generateTokens(user: User, meta?: { userAgent?: string; ipAddress?: string }) {
    const expiresIn = 15 * 60; // 15 minutes in seconds
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      dispensaryId: user.dispensaryId,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('jwt.secret'),
      expiresIn: this.config.get<number>('jwt.accessTtl', 900),
    });

    const rawRefresh = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefresh);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt,
        dispensaryId: user.dispensaryId,
        organizationId: user.organizationId,
        ...meta,
      })
    );

    return { accessToken, refreshToken: rawRefresh, expiresIn };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
