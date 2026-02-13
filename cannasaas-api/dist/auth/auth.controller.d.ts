import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: import("../users/entities/user.entity").User;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: import("../users/entities/user.entity").User;
        accessToken: string;
        refreshToken: string;
    }>;
    getProfile(req: any): any;
}
