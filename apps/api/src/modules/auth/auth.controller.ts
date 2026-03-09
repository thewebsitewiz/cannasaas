import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.authService.refreshTokens(req, res);
  }
}
