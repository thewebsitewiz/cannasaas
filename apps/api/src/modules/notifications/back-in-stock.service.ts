import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';

@Injectable()
export class BackInStockService implements OnModuleInit {
  private readonly logger = new Logger(BackInStockService.name);
  constructor(
    @InjectDataSource() private ds: DataSource,
    private readonly notifications: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS back_in_stock_subscriptions (
        subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        product_id UUID NOT NULL,
        variant_id UUID,
        dispensary_id UUID NOT NULL,
        notification_method VARCHAR(20) DEFAULT 'email',
        notified BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id, variant_id)
      );
    `);
    this.logger.log('back_in_stock_subscriptions table ensured');
  }

  async subscribe(userId: string, productId: string, variantId: string | null, dispensaryId: string, method = 'email'): Promise<any> {
    const [sub] = await this.ds.query(
      `INSERT INTO back_in_stock_subscriptions (user_id, product_id, variant_id, dispensary_id, notification_method)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, product_id, variant_id) DO UPDATE SET notified = false, notification_method = $5
       RETURNING *`,
      [userId, productId, variantId, dispensaryId, method],
    );
    return sub;
  }

  async unsubscribe(subscriptionId: string): Promise<boolean> {
    await this.ds.query(
      `DELETE FROM back_in_stock_subscriptions WHERE subscription_id = $1`,
      [subscriptionId],
    );
    return true;
  }

  async getSubscriptions(userId: string): Promise<any[]> {
    return this.ds.query(
      `SELECT s.*, p.name as product_name
       FROM back_in_stock_subscriptions s
       LEFT JOIN products p ON p.id = s.product_id
       WHERE s.user_id = $1 AND s.notified = false
       ORDER BY s.created_at DESC`,
      [userId],
    );
  }

  async checkAndNotify(variantId: string): Promise<number> {
    const subs = await this.ds.query(
      `SELECT s.*, u.email, u."firstName"
       FROM back_in_stock_subscriptions s
       JOIN users u ON u.user_id = s.user_id
       WHERE s.variant_id = $1 AND s.notified = false`,
      [variantId],
    );

    if (!subs.length) return 0;

    // Get product name
    const [product] = await this.ds.query(
      `SELECT p.name FROM products p
       JOIN product_variants pv ON pv.product_id = p.id
       WHERE pv.variant_id = $1`,
      [variantId],
    );
    const productName = product?.name || 'a product you were watching';

    let notified = 0;
    for (const sub of subs) {
      try {
        if (sub.notification_method === 'email' && sub.email) {
          await this.notifications.sendEmail({
            to: sub.email,
            subject: `${productName} is back in stock!`,
            body: `Hi ${sub.firstName || 'there'},\n\nGreat news! ${productName} is back in stock at your dispensary.\n\nVisit the store to grab it before it sells out again.`,
            userId: sub.user_id,
            dispensaryId: sub.dispensary_id,
            templateCode: 'back_in_stock',
          });
        } else if (sub.notification_method === 'sms') {
          const [user] = await this.ds.query(`SELECT phone FROM users WHERE user_id = $1`, [sub.user_id]);
          if (user?.phone) {
            await this.notifications.sendSms({
              to: user.phone,
              body: `${productName} is back in stock! Visit your dispensary to grab it.`,
              userId: sub.user_id,
              dispensaryId: sub.dispensary_id,
              templateCode: 'back_in_stock_sms',
            });
          }
        }

        await this.ds.query(
          `UPDATE back_in_stock_subscriptions SET notified = true WHERE subscription_id = $1`,
          [sub.subscription_id],
        );
        notified++;
      } catch (err: any) {
        this.logger.error(`Failed to notify subscription ${sub.subscription_id}: ${err.message}`);
      }
    }

    this.logger.log(`Notified ${notified} users about variant ${variantId} back in stock`);
    return notified;
  }

  @OnEvent('inventory.restocked')
  async onInventoryRestocked(payload: { variantId: string }): Promise<void> {
    if (!payload.variantId) return;
    await this.checkAndNotify(payload.variantId);
  }
}
