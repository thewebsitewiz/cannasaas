import { Controller, Post, Req, Res, Headers, HttpCode } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly stripe: StripeService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const result = await this.stripe.handleWebhook((req as any).rawBody || req.body, signature);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
