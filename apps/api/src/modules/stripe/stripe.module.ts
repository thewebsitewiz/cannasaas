import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeResolver } from './stripe.resolver';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  controllers: [StripeWebhookController],
  providers: [StripeService, StripeResolver],
  exports: [StripeService],
})
export class StripeModule {}
