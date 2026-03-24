import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

const SUPPORTED_EVENTS = [
  'order.created',
  'order.completed',
  'order.cancelled',
  'payment.received',
  'inventory.low_stock',
  'customer.registered',
] as const;

@Injectable()
export class WebhookService implements OnModuleInit {
  private readonly logger = new Logger(WebhookService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        webhook_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dispensary_id UUID NOT NULL,
        url VARCHAR(500) NOT NULL,
        events TEXT[] NOT NULL,
        secret VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        webhook_id UUID NOT NULL REFERENCES webhook_endpoints(webhook_id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        response_status INT,
        response_body TEXT,
        delivered_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'pending',
        attempts INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    this.logger.log('Webhook tables ensured');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async registerWebhook(dispensaryId: string, url: string, events: string[]): Promise<any> {
    // Validate URL
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new BadRequestException('Invalid webhook URL — must be a valid HTTP(S) URL');
    }

    // Validate events
    for (const event of events) {
      if (!SUPPORTED_EVENTS.includes(event as any)) {
        throw new BadRequestException(`Unsupported event: ${event}. Supported: ${SUPPORTED_EVENTS.join(', ')}`);
      }
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const [row] = await this.ds.query(
      `INSERT INTO webhook_endpoints (dispensary_id, url, events, secret)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [dispensaryId, url, events, secret],
    );

    this.logger.log(`Webhook registered: ${row.webhook_id} for ${url}`);
    return row;
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    const result = await this.ds.query(
      `DELETE FROM webhook_endpoints WHERE webhook_id = $1`, [webhookId],
    );
    return (result[1] ?? 0) > 0;
  }

  async listWebhooks(dispensaryId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT webhook_id, dispensary_id, url, events, is_active, created_at
       FROM webhook_endpoints WHERE dispensary_id = $1 ORDER BY created_at DESC`,
      [dispensaryId],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERY
  // ═══════════════════════════════════════════════════════════════════════════

  async deliverWebhook(event: string, dispensaryId: string, payload: any): Promise<void> {
    const webhooks = await this.ds.query(
      `SELECT * FROM webhook_endpoints
       WHERE dispensary_id = $1 AND is_active = true AND $2 = ANY(events)`,
      [dispensaryId, event],
    );

    for (const wh of webhooks) {
      const body = JSON.stringify({ event, dispensaryId, payload, timestamp: new Date().toISOString() });
      const signature = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');

      // Create delivery record
      const [delivery] = await this.ds.query(
        `INSERT INTO webhook_deliveries (webhook_id, event_type, payload)
         VALUES ($1, $2, $3) RETURNING delivery_id`,
        [wh.webhook_id, event, payload],
      );

      // Fire and forget delivery attempt
      this.attemptDelivery(delivery.delivery_id, wh.url, body, signature).catch(err =>
        this.logger.error(`Webhook delivery failed: ${delivery.delivery_id} — ${err.message}`),
      );
    }
  }

  private async attemptDelivery(deliveryId: string, url: string, body: string, signature: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': deliveryId,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const responseBody = await response.text().catch(() => '');

      await this.ds.query(
        `UPDATE webhook_deliveries
         SET status = $1, response_status = $2, response_body = $3,
             delivered_at = NOW(), attempts = attempts + 1
         WHERE delivery_id = $4`,
        [response.ok ? 'delivered' : 'failed', response.status, responseBody.slice(0, 2000), deliveryId],
      );
    } catch (err: any) {
      await this.ds.query(
        `UPDATE webhook_deliveries
         SET status = 'failed', response_body = $1, attempts = attempts + 1
         WHERE delivery_id = $2`,
        [err.message?.slice(0, 2000) ?? 'Unknown error', deliveryId],
      );
    }
  }

  async getDeliveryHistory(webhookId: string, limit = 50): Promise<any[]> {
    return this.ds.query(
      `SELECT * FROM webhook_deliveries
       WHERE webhook_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [webhookId, limit],
    );
  }

  async retryDelivery(deliveryId: string): Promise<any> {
    const [delivery] = await this.ds.query(
      `SELECT wd.*, we.url, we.secret FROM webhook_deliveries wd
       JOIN webhook_endpoints we ON we.webhook_id = wd.webhook_id
       WHERE wd.delivery_id = $1`,
      [deliveryId],
    );
    if (!delivery) throw new NotFoundException('Delivery not found');

    const body = JSON.stringify({
      event: delivery.event_type,
      payload: delivery.payload,
      timestamp: new Date().toISOString(),
      retry: true,
    });
    const signature = crypto.createHmac('sha256', delivery.secret).update(body).digest('hex');

    await this.ds.query(
      `UPDATE webhook_deliveries SET status = 'pending' WHERE delivery_id = $1`,
      [deliveryId],
    );

    await this.attemptDelivery(deliveryId, delivery.url, body, signature);

    const [updated] = await this.ds.query(
      `SELECT * FROM webhook_deliveries WHERE delivery_id = $1`, [deliveryId],
    );
    return updated;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  @OnEvent('order.created')
  async onOrderCreated(payload: any): Promise<void> {
    if (payload?.dispensaryId) await this.deliverWebhook('order.created', payload.dispensaryId, payload);
  }

  @OnEvent('order.completed')
  async onOrderCompleted(payload: any): Promise<void> {
    if (payload?.dispensaryId) await this.deliverWebhook('order.completed', payload.dispensaryId, payload);
  }

  @OnEvent('order.cancelled')
  async onOrderCancelled(payload: any): Promise<void> {
    if (payload?.dispensaryId) await this.deliverWebhook('order.cancelled', payload.dispensaryId, payload);
  }

  @OnEvent('payment.received')
  async onPaymentReceived(payload: any): Promise<void> {
    if (payload?.dispensaryId) await this.deliverWebhook('payment.received', payload.dispensaryId, payload);
  }

  @OnEvent('inventory.low_stock')
  async onLowStock(payload: any): Promise<void> {
    if (payload?.dispensaryId) await this.deliverWebhook('inventory.low_stock', payload.dispensaryId, payload);
  }

  @OnEvent('customer.registered')
  async onCustomerRegistered(payload: any): Promise<void> {
    if (payload?.dispensaryId) await this.deliverWebhook('customer.registered', payload.dispensaryId, payload);
  }
}
