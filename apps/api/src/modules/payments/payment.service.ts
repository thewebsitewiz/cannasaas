import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, sql } from 'drizzle-orm';
import * as schema from '../../database/schema';

export const DRIZZLE = Symbol.for('DRIZZLE');
type DB = NodePgDatabase<typeof schema>;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(@Inject(DRIZZLE) private db: DB) {}

  // ── Cash Discount Config (Admin) ──────────────────────────────────────────

  async getCashDiscount(dispensaryId: string): Promise<{ cashDiscountPercent: number; isCashEnabled: boolean; cashDeliveryEnabled: boolean }> {
    const result = await this.db.execute(
      sql`SELECT cash_discount_percent, is_cash_enabled, cash_delivery_enabled FROM dispensaries WHERE entity_id = ${dispensaryId}`,
    );
    const disp = result.rows[0] as any;
    if (!disp) throw new NotFoundException('Dispensary not found');
    return {
      cashDiscountPercent: parseFloat(disp.cash_discount_percent ?? 0),
      isCashEnabled: disp.is_cash_enabled,
      cashDeliveryEnabled: disp.cash_delivery_enabled,
    };
  }

  async setCashDiscount(dispensaryId: string, percent: number, cashDeliveryEnabled?: boolean): Promise<{ cashDiscountPercent: number; isCashEnabled: boolean; cashDeliveryEnabled: boolean }> {
    if (percent < 0 || percent > 20) throw new BadRequestException('Cash discount must be between 0% and 20%');

    if (cashDeliveryEnabled !== undefined) {
      await this.db.execute(sql`
        UPDATE dispensaries SET cash_discount_percent = ${percent}, is_cash_enabled = ${percent > 0},
        cash_delivery_enabled = ${cashDeliveryEnabled}, updated_at = NOW()
        WHERE entity_id = ${dispensaryId}
      `);
    } else {
      await this.db.execute(sql`
        UPDATE dispensaries SET cash_discount_percent = ${percent}, is_cash_enabled = ${percent > 0},
        updated_at = NOW()
        WHERE entity_id = ${dispensaryId}
      `);
    }

    this.logger.log(`Cash discount set to ${percent}% for ${dispensaryId}`);
    return this.getCashDiscount(dispensaryId);
  }

  // ── Calculate Cash Discount ───────────────────────────────────────────────

  async calculateCashDiscount(dispensaryId: string, subtotal: number): Promise<{ discountPercent: number; discountAmount: number; adjustedSubtotal: number }> {
    const config = await this.getCashDiscount(dispensaryId);
    const discountAmount = parseFloat((subtotal * (config.cashDiscountPercent / 100)).toFixed(2));
    return {
      discountPercent: config.cashDiscountPercent,
      discountAmount,
      adjustedSubtotal: parseFloat((subtotal - discountAmount).toFixed(2)),
    };
  }

  // ── Process Cash Payment ──────────────────────────────────────────────────

  async processCashPayment(input: {
    orderId: string;
    dispensaryId: string;
    cashTendered: number;
    staffUserId: string;
    applyDiscount: boolean;
  }): Promise<any> {
    return this.db.transaction(async (tx) => {
      // Get order
      const orderResult = await tx.execute(sql`
        SELECT "orderId", subtotal, "taxTotal", total, "discountTotal", "orderStatus", payment_method
        FROM orders WHERE "orderId" = ${input.orderId} AND "dispensaryId" = ${input.dispensaryId}
      `);
      const order = orderResult.rows[0] as any;
      if (!order) throw new NotFoundException('Order not found');
      if (order.orderStatus === 'cancelled') throw new BadRequestException('Cannot pay for a cancelled order');

      let finalTotal = parseFloat(order.total);
      let cashDiscountApplied = 0;

      // Apply cash discount if requested
      if (input.applyDiscount) {
        const discount = await this.calculateCashDiscount(input.dispensaryId, parseFloat(order.subtotal));
        if (discount.discountPercent > 0) {
          cashDiscountApplied = discount.discountAmount;
          const newDiscountTotal = parseFloat(order.discountTotal) + cashDiscountApplied;
          finalTotal = parseFloat(order.subtotal) - newDiscountTotal + parseFloat(order.taxTotal);
          finalTotal = parseFloat(finalTotal.toFixed(2));

          await tx.execute(sql`
            UPDATE orders SET
              "discountTotal" = ${newDiscountTotal},
              total = ${finalTotal},
              cash_discount_applied = ${cashDiscountApplied},
              payment_method = 'cash',
              "updatedAt" = NOW()
            WHERE "orderId" = ${input.orderId}
          `);
        }
      } else {
        await tx.execute(sql`
          UPDATE orders SET payment_method = 'cash', "updatedAt" = NOW() WHERE "orderId" = ${input.orderId}
        `);
      }

      // Validate tendered amount
      if (input.cashTendered < finalTotal) {
        throw new BadRequestException(`Cash tendered ($${input.cashTendered.toFixed(2)}) is less than total ($${finalTotal.toFixed(2)})`);
      }

      const changeGiven = parseFloat((input.cashTendered - finalTotal).toFixed(2));

      // Create payment record
      const [payment] = await tx
        .insert(schema.payments)
        .values({
          orderId: input.orderId,
          dispensaryId: input.dispensaryId,
          method: 'cash',
          amount: finalTotal,
          cashTendered: input.cashTendered,
          changeGiven,
          status: 'completed',
        })
        .returning();

      this.logger.log(
        `Cash payment: order=${input.orderId} total=$${finalTotal} tendered=$${input.cashTendered} change=$${changeGiven}` +
        (cashDiscountApplied > 0 ? ` discount=$${cashDiscountApplied}` : ''),
      );

      return payment;
    });
  }

  // ── Process Card Payment (placeholder) ────────────────────────────────────

  async processCardPayment(input: {
    orderId: string;
    dispensaryId: string;
    stripePaymentIntentId: string;
  }): Promise<any> {
    const orderResult = await this.db.execute(
      sql`SELECT "orderId", total FROM orders WHERE "orderId" = ${input.orderId} AND "dispensaryId" = ${input.dispensaryId}`,
    );
    const order = orderResult.rows[0] as any;
    if (!order) throw new NotFoundException('Order not found');

    await this.db.execute(
      sql`UPDATE orders SET payment_method = 'card', "updatedAt" = NOW() WHERE "orderId" = ${input.orderId}`,
    );

    const [payment] = await this.db
      .insert(schema.payments)
      .values({
        orderId: input.orderId,
        dispensaryId: input.dispensaryId,
        method: 'card',
        amount: parseFloat(order.total),
        stripePaymentIntentId: input.stripePaymentIntentId,
        status: 'completed',
      })
      .returning();

    return payment;
  }

  // ── Get Payment for Order ─────────────────────────────────────────────────

  async getPaymentForOrder(orderId: string): Promise<any | null> {
    const [payment] = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, orderId))
      .orderBy(desc(schema.payments.createdAt))
      .limit(1);
    return payment ?? null;
  }
}
