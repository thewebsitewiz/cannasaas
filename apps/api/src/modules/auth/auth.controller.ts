import { Controller, Post, Body, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterInput, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginInput, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(200)
  async refresh(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(user.sub, user.rawToken);
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() user: any, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.refresh_token;
    if (rawToken) await this.auth.logout(user.sub, rawToken);
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }

  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.sub);
    res.clearCookie('refresh_token');
    return { message: 'All sessions revoked' };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });
  }
}
