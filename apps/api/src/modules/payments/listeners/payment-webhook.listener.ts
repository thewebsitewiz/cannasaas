import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PaymentProcessorName,
  ProcessorWebhookEvent,
} from '../processors/payment-processor.interface';
import { PaymentLifecycleQueueService } from '../queue/payment-lifecycle.queue-service';

interface WebhookEventPayload {
  readonly processor: PaymentProcessorName;
  readonly event: ProcessorWebhookEvent;
}

@Injectable()
export class PaymentWebhookListener {
  private readonly logger = new Logger(PaymentWebhookListener.name);

  constructor(private readonly queue: PaymentLifecycleQueueService) {}

  @OnEvent('payment.webhook.**')
  async handle(payload: WebhookEventPayload): Promise<void> {
    this.logger.log(
      `Webhook event received: ${payload.processor} ${payload.event.type} ${payload.event.processorTransactionId}`,
    );
    await this.queue.enqueueWebhookEvent(payload.processor, payload.event);
  }
}
