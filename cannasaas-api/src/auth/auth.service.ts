import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { TenantService } from '../common/tenant/tenant.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private tenantService: TenantService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; accessToken: string }> {
    const tenantId = this.tenantService.getTenantId();

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: {
        email: registerDto.email,
        tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...registerDto,
      passwordHash,
      tenantId,
      emailVerificationToken: this.generateToken(),
    });

    await this.userRepository.save(user);

    // Generate JWT
    const accessToken = this.generateAccessToken(user);

    // TODO: Send verification email

    return { user, accessToken };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const tenantId = this.tenantService.getTenantId();

    // Find user
    const user = await this.userRepository.findOne({
      where: {
        email: loginDto.email,
        tenantId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: instanceToPlain(user) as User,
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '1h',
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}
