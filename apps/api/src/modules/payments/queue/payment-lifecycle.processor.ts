import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment } from '../entities/payment.entity';
import {
  PAYMENT_LIFECYCLE_QUEUE,
  PaymentLifecycleJobName,
} from './payment-lifecycle.queue';
import { PaymentLifecycleJobData } from './payment-lifecycle.queue-service';
import {
  PAYMENT_LIFECYCLE_EVENT,
  PaymentLifecycleEvent,
} from '../events/payment-lifecycle.event';
import { ProcessorWebhookEventType } from '../processors/payment-processor.interface';

const TERMINAL_STATUS_BY_EVENT: Readonly<
  Record<ProcessorWebhookEventType, string>
> = {
  'payment.succeeded': 'completed',
  'payment.failed': 'failed',
  'payment.pending': 'pending',
  'refund.succeeded': 'refunded',
  'refund.failed': 'refund_failed',
};

@Processor(PAYMENT_LIFECYCLE_QUEUE)
export class PaymentLifecycleProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentLifecycleProcessor.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly events: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<PaymentLifecycleJobData>): Promise<void> {
    if (job.name !== PaymentLifecycleJobName.HANDLE_WEBHOOK) return;

    const { processor, event } = job.data;
    const targetStatus = TERMINAL_STATUS_BY_EVENT[event.type];
    if (!targetStatus) {
      this.logger.warn(
        `Unknown event type "${event.type}" for ${processor} tx=${event.processorTransactionId} — skipping`,
      );
      return;
    }

    const payment = await this.paymentRepo.findOne({
      where: {
        processorName: processor,
        processorTransactionId: event.processorTransactionId,
      },
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for ${processor} tx=${event.processorTransactionId} — webhook arrived before initiate completed?`,
      );
      throw new Error(
        `Payment not found for ${processor} tx=${event.processorTransactionId}`,
      );
    }

    if (payment.status === targetStatus) {
      this.logger.log(
        `Payment ${payment.paymentId} already in status=${targetStatus} — webhook is a duplicate, acknowledging`,
      );
      return;
    }

    payment.status = targetStatus;
    if (event.type === 'payment.failed' || event.type === 'refund.failed') {
      payment.failureReason = event.failureReason ?? 'unknown';
    }
    await this.paymentRepo.save(payment);

    const lifecycle: PaymentLifecycleEvent = {
      type: event.type,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      dispensaryId: payment.dispensaryId,
      processor,
      processorTransactionId: event.processorTransactionId,
      amountCents: event.amountCents,
      failureReason: payment.failureReason,
    };
    this.events.emit(PAYMENT_LIFECYCLE_EVENT, lifecycle);

    this.logger.log(
      `Payment ${payment.paymentId} → ${targetStatus} (${processor} tx=${event.processorTransactionId})`,
    );
  }
}
