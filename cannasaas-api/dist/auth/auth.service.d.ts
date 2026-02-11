import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TenantService } from '../common/tenant/tenant.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private userRepository;
    private jwtService;
    private tenantService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, tenantService: TenantService);
    register(registerDto: RegisterDto): Promise<{
        user: User;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    validateUser(userId: string): Promise<User>;
    private generateAccessToken;
    private generateRefreshToken;
    private generateToken;
}
