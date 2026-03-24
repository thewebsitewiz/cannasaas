import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookResolver } from './webhook.resolver';

@Module({
  providers: [WebhookService, WebhookResolver],
  exports: [WebhookService],
})
export class WebhookModule {}
