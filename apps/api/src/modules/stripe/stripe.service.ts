import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Inject, ConfigService } from '@nestjs/config';
import { Inject, EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, InjectQueue } from '@nestjs/bullmq';
import { Inject, Queue } from 'bullmq';
import Stripe from 'stripe';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe | null = null;
  private webhookSecret: string;

  constructor(
    private config: ConfigService,
    @Inject(DRIZZLE) private db: any,
    private events: EventEmitter2,
    @InjectQueue('stripe-webhooks') private webhookQueue: Queue
  ) {
    const key = this.config.get<string>('stripe.secretKey');
    this.webhookSecret = this.config.get<string>('stripe.webhookSecret') || '';

    if (key && key !== 'sk_test_CHANGE_ME' && !key.startsWith('sk_test_CHANGE')) {
      this.stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
      this.logger.log('Stripe initialized (live)');
    } else if (key && key.startsWith('sk_test_')) {
      this.stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' as any });
      this.logger.log('Stripe initialized (test mode)');
    } else {
      this.logger.warn('Stripe not configured — card payments disabled. Set STRIPE_SECRET_KEY in .env');
    }
  }

  isEnabled(): boolean {
    return this.stripe !== null;
  }

  // ═══ PAYMENT INTENTS ═══

  async createPaymentIntent(orderId: string, dispensaryId: string, amountCents: number, metadata?: Record<string, string>): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.stripe) throw new BadRequestException('Card payments are not configured. Please use cash.');

    if (amountCents < 50) throw new BadRequestException('Minimum payment is $0.50');

    // Check if a payment intent already exists for this order (idempotency)
    const [existing] = await this._q(
      `SELECT stripe_payment_intent_id FROM payments WHERE order_id = $1 AND stripe_payment_intent_id IS NOT NULL`,
      [orderId],
    );
    if (existing) {
      // Retrieve the existing intent from Stripe to return its clientSecret
      const existingIntent = await this.stripe.paymentIntents.retrieve(existing.stripe_payment_intent_id);
      this.logger.log('Returning existing payment intent: ' + existingIntent.id + ' for order ' + orderId);
      return { clientSecret: existingIntent.client_secret!, paymentIntentId: existingIntent.id };
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId, dispensaryId, ...metadata },
    }, {
      idempotencyKey: orderId,
    });

    // Save intent to DB
    await this._q(
      `INSERT INTO payments (order_id, dispensary_id, method, amount, stripe_payment_intent_id, status)
       VALUES ($1, $2, 'card', $3, $4, 'pending')
       ON CONFLICT (order_id) WHERE method = 'card' DO UPDATE SET stripe_payment_intent_id = $4, amount = $3, updated_at = NOW()`,
      [orderId, dispensaryId, (amountCents / 100).toFixed(2), intent.id],
    );

    this.logger.log('Payment intent created: ' + intent.id + ' for order ' + orderId + ' ($' + (amountCents / 100).toFixed(2) + ')');

    return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    if (!this.stripe) throw new BadRequestException('Stripe not configured');

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status === 'succeeded') {
      await this.markPaymentSucceeded(intent.id, intent.latest_charge as string);
      return { status: 'succeeded', orderId: intent.metadata.orderId };
    }

    return { status: intent.status, orderId: intent.metadata.orderId };
  }

  // ═══ WEBHOOKS ═══

  async handleWebhook(payload: Buffer, signature: string): Promise<{ received: boolean }> {
    if (!this.stripe) return { received: false };

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (err: any) {
      this.logger.error('Webhook signature verification failed: ' + err.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log('Webhook received: ' + event.type);

    // Enqueue for reliable async processing with retries (dead-letter after 5 attempts)
    await this.webhookQueue.add(event.type, {
      eventType: event.type,
      eventId: event.id,
      payload: event.data.object,
    }, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    // Still emit events for real-time listeners (e.g. WebSocket notifications)
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata.orderId) {
        this.events.emit('order.payment_received', {
          orderId: intent.metadata.orderId,
          dispensaryId: intent.metadata.dispensaryId,
          amount: intent.amount / 100,
          paymentIntentId: intent.id,
        });
      }
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
    await this.markPaymentSucceeded(intent.id, intent.latest_charge as string);

    const orderId = intent.metadata.orderId;
    if (orderId) {
      this.events.emit('order.payment_received', {
        orderId,
        dispensaryId: intent.metadata.dispensaryId,
        amount: intent.amount / 100,
        paymentIntentId: intent.id,
      });
    }
  }

  private async handlePaymentFailed(intent: Stripe.PaymentIntent): Promise<void> {
    await this._q(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2',
      ['failed', intent.id],
    );

    const orderId = intent.metadata.orderId;
    this.logger.warn('Payment failed: ' + intent.id + ' for order ' + orderId);
  }

  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    await this._q(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_charge_id = $2',
      ['refunded', charge.id],
    );
    this.logger.log('Refund processed: ' + charge.id);
  }

  private async markPaymentSucceeded(intentId: string, chargeId: string): Promise<void> {
    await this._q(
      'UPDATE payments SET status = $1, stripe_charge_id = $2, updated_at = NOW() WHERE stripe_payment_intent_id = $3',
      ['succeeded', chargeId, intentId],
    );

    // Update order payment status
    const [payment] = await this._q(
      'SELECT order_id FROM payments WHERE stripe_payment_intent_id = $1', [intentId],
    );
    if (payment) {
      await this._q(
        'UPDATE orders SET "paymentStatus" = $1, "updatedAt" = NOW() WHERE "orderId" = $2',
        ['paid', payment.order_id],
      );
    }

    this.logger.log('Payment succeeded: ' + intentId);
  }

  // ═══ REFUNDS ═══

  async refundPayment(orderId: string, amountCents?: number, reason?: string): Promise<any> {
    if (!this.stripe) throw new BadRequestException('Stripe not configured');

    const [payment] = await this._q(
      'SELECT stripe_payment_intent_id, stripe_charge_id, amount FROM payments WHERE order_id = $1 AND method = $2 AND status = $3',
      [orderId, 'card', 'succeeded'],
    );
    if (!payment) throw new NotFoundException('No successful card payment found for this order');

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment.stripe_payment_intent_id,
      reason: (reason as any) || 'requested_by_customer',
    };
    if (amountCents) refundParams.amount = amountCents;

    const refund = await this.stripe.refunds.create(refundParams);

    const refundAmount = (refund.amount / 100).toFixed(2);
    await this._q(
      'UPDATE payments SET status = $1, updated_at = NOW() WHERE stripe_payment_intent_id = $2',
      [amountCents ? 'partially_refunded' : 'refunded', payment.stripe_payment_intent_id],
    );

    this.logger.log('Refund issued: $' + refundAmount + ' for order ' + orderId);
    return { refundId: refund.id, amount: refundAmount, status: refund.status };
  }

  // ═══ PAYMENT STATUS ═══

  async getPaymentStatus(orderId: string): Promise<any> {
    const [payment] = await this._q(
      'SELECT payment_id as "paymentId", method, amount, status, stripe_payment_intent_id as "stripePaymentIntentId", created_at as "createdAt" FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId],
    );
    return payment || { status: 'no_payment', method: null };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
