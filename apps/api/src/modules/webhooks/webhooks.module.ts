import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentWebhooksController } from './payment-webhooks.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [PaymentWebhooksController],
})
export class WebhooksModule {}
