import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  async createConnectedAccount(data: { email: string; businessName: string; country?: string }) {
    this.logger.log(`[STUB] Creating Stripe connected account for ${data.email}`);
    return { id: `acct_stub_${Date.now()}` };
  }

  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    this.logger.log(`[STUB] Creating account link for ${accountId}`);
    return { url: returnUrl };
  }
}
