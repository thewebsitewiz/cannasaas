import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Processor('stripe-webhooks')
export class StripeWebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(StripeWebhookProcessor.name);

  constructor(@InjectDataSource() private ds: DataSource) { super(); }

  async process(job: Job<{ eventType: string; eventId: string; payload: any }>): Promise<void> {
    const { eventType, eventId, payload } = job.data;
    this.logger.log(`Processing webhook ${eventType} (${eventId}), attempt ${job.attemptsMade + 1}`);

    try {
      // Process based on event type
      if (eventType === 'payment_intent.succeeded') {
        await this.ds.query(
          `UPDATE payments SET status = 'succeeded', updated_at = NOW() WHERE stripe_payment_intent_id = $1`,
          [payload.id]
        );
        await this.ds.query(
          `UPDATE orders SET payment_status = 'paid', updated_at = NOW() WHERE order_id = (SELECT order_id FROM payments WHERE stripe_payment_intent_id = $1)`,
          [payload.id]
        );
      } else if (eventType === 'payment_intent.payment_failed') {
        await this.ds.query(
          `UPDATE payments SET status = 'failed', updated_at = NOW() WHERE stripe_payment_intent_id = $1`,
          [payload.id]
        );
      } else if (eventType === 'charge.refunded') {
        const refundAmount = payload.amount_refunded;
        const totalAmount = payload.amount;
        const status = refundAmount >= totalAmount ? 'refunded' : 'partially_refunded';
        await this.ds.query(
          `UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_charge_id = $2`,
          [status, payload.id]
        );
      }

      this.logger.log(`Webhook ${eventId} processed successfully`);
    } catch (err) {
      this.logger.error(`Webhook ${eventId} failed: ${err}`, (err as Error).stack);
      throw err; // BullMQ will retry
    }
  }
}
