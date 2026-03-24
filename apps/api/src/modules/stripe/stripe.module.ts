import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StripeService } from './stripe.service';
import { StripeResolver } from './stripe.resolver';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookProcessor } from './stripe-webhook.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'stripe-webhooks' })],
  controllers: [StripeWebhookController],
  providers: [StripeService, StripeResolver, StripeWebhookProcessor],
  exports: [StripeService],
})
export class StripeModule {}
