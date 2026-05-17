import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PaymentProcessorName,
  ProcessorWebhookEvent,
} from '../processors/payment-processor.interface';
import {
  PAYMENT_LIFECYCLE_QUEUE,
  PaymentLifecycleJobName,
} from './payment-lifecycle.queue';

export interface PaymentLifecycleJobData {
  readonly processor: PaymentProcessorName;
  readonly event: ProcessorWebhookEvent;
  readonly attemptNumber: number;
}

@Injectable()
export class PaymentLifecycleQueueService {
  private readonly logger = new Logger(PaymentLifecycleQueueService.name);

  constructor(
    @InjectQueue(PAYMENT_LIFECYCLE_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueueWebhookEvent(
    processor: PaymentProcessorName,
    event: ProcessorWebhookEvent,
  ): Promise<void> {
    const data: PaymentLifecycleJobData = {
      processor,
      event,
      attemptNumber: 1,
    };
    await this.queue.add(PaymentLifecycleJobName.HANDLE_WEBHOOK, data, {
      // Idempotent by (processor, tx). BullMQ will reject a job with this
      // jobId already in active/waiting/delayed state — preventing duplicate
      // work when a processor retries the same webhook quickly.
      jobId: `${processor}:${event.processorTransactionId}:${event.type}`,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 15_000, // 15s, 30s, 60s, 2m, 4m
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    });
    this.logger.log(
      `Enqueued payment lifecycle job: processor=${processor} tx=${event.processorTransactionId} type=${event.type}`,
    );
  }

  async getQueueStats(): Promise<Record<string, number>> {
    const [waiting, active, failed, completed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getFailedCount(),
      this.queue.getCompletedCount(),
      this.queue.getDelayedCount(),
    ]);
    return { waiting, active, failed, completed, delayed };
  }
}
