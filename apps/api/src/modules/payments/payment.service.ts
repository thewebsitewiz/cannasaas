import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Payment } from './entities/payment.entity';

interface CashConfigRow {
  cash_discount_percent: string | number | null;
  is_cash_enabled: boolean;
  cash_delivery_enabled: boolean;
}

interface OrderRow {
  orderId: string;
  subtotal: string | number;
  taxTotal: string | number;
  total: string | number;
  discountTotal: string | number;
  orderStatus: string;
  payment_method: string | null;
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

async function runnerQuery<T>(
  qr: QueryRunner,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await qr.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ── Cash Discount Config (Admin) ──────────────────────────────────────────

  async getCashDiscount(dispensaryId: string): Promise<{
    cashDiscountPercent: number;
    isCashEnabled: boolean;
    cashDeliveryEnabled: boolean;
  }> {
    const rows = await rawQuery<CashConfigRow>(
      this.dataSource,
      `SELECT cash_discount_percent, is_cash_enabled, cash_delivery_enabled FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = rows[0];
    if (!disp) throw new NotFoundException('Dispensary not found');
    return {
      cashDiscountPercent: toNumber(disp.cash_discount_percent),
      isCashEnabled: disp.is_cash_enabled,
      cashDeliveryEnabled: disp.cash_delivery_enabled,
    };
  }

  async setCashDiscount(
    dispensaryId: string,
    percent: number,
    cashDeliveryEnabled?: boolean,
  ): Promise<{
    cashDiscountPercent: number;
    isCashEnabled: boolean;
    cashDeliveryEnabled: boolean;
  }> {
    if (percent < 0 || percent > 20)
      throw new BadRequestException('Cash discount must be between 0% and 20%');

    let sql = `UPDATE dispensaries SET cash_discount_percent = $1, is_cash_enabled = $2, updated_at = NOW()`;
    const params: unknown[] = [percent, percent > 0];

    if (cashDeliveryEnabled !== undefined) {
      sql += `, cash_delivery_enabled = $3 WHERE entity_id = $4`;
      params.push(cashDeliveryEnabled, dispensaryId);
    } else {
      sql += ` WHERE entity_id = $3`;
      params.push(dispensaryId);
    }

    await this.dataSource.query(sql, params);
    this.logger.log(`Cash discount set to ${percent}% for ${dispensaryId}`);
    return this.getCashDiscount(dispensaryId);
  }

  // ── Calculate Cash Discount ───────────────────────────────────────────────

  async calculateCashDiscount(
    dispensaryId: string,
    subtotal: number,
  ): Promise<{
    discountPercent: number;
    discountAmount: number;
    adjustedSubtotal: number;
  }> {
    const config = await this.getCashDiscount(dispensaryId);
    const discountAmount = parseFloat(
      (subtotal * (config.cashDiscountPercent / 100)).toFixed(2),
    );
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
  }): Promise<Payment> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const orderRows = await runnerQuery<OrderRow>(
        qr,
        `SELECT "orderId", subtotal, "taxTotal", total, "discountTotal", "orderStatus", payment_method
         FROM orders WHERE "orderId" = $1 AND "dispensaryId" = $2`,
        [input.orderId, input.dispensaryId],
      );
      const order = orderRows[0];
      if (!order) throw new NotFoundException('Order not found');
      if (order.orderStatus === 'cancelled')
        throw new BadRequestException('Cannot pay for a cancelled order');

      let finalTotal = toNumber(order.total);
      let cashDiscountApplied = 0;

      // Apply cash discount if requested
      if (input.applyDiscount) {
        const discount = await this.calculateCashDiscount(
          input.dispensaryId,
          toNumber(order.subtotal),
        );
        if (discount.discountPercent > 0) {
          cashDiscountApplied = discount.discountAmount;
          const newDiscountTotal =
            toNumber(order.discountTotal) + cashDiscountApplied;
          finalTotal =
            toNumber(order.subtotal) -
            newDiscountTotal +
            toNumber(order.taxTotal);
          finalTotal = parseFloat(finalTotal.toFixed(2));

          // Update order with cash discount
          await qr.query(
            `UPDATE orders SET
              "discountTotal" = $1,
              total = $2,
              cash_discount_applied = $3,
              payment_method = 'cash',
              "updatedAt" = NOW()
             WHERE "orderId" = $4`,
            [newDiscountTotal, finalTotal, cashDiscountApplied, input.orderId],
          );
        }
      } else {
        // Just mark as cash payment
        await qr.query(
          `UPDATE orders SET payment_method = 'cash', "updatedAt" = NOW() WHERE "orderId" = $1`,
          [input.orderId],
        );
      }

      // Validate tendered amount
      if (input.cashTendered < finalTotal) {
        throw new BadRequestException(
          `Cash tendered ($${input.cashTendered.toFixed(2)}) is less than total ($${finalTotal.toFixed(2)})`,
        );
      }

      const changeGiven = parseFloat(
        (input.cashTendered - finalTotal).toFixed(2),
      );

      // Create payment record
      const payment = this.paymentRepo.create({
        orderId: input.orderId,
        dispensaryId: input.dispensaryId,
        method: 'cash',
        amount: finalTotal,
        cashTendered: input.cashTendered,
        changeGiven,
        status: 'completed',
      });

      const saved = await this.paymentRepo.save(payment);

      this.logger.log(
        `Cash payment: order=${input.orderId} total=$${finalTotal} tendered=$${input.cashTendered} change=$${changeGiven}` +
          (cashDiscountApplied > 0 ? ` discount=$${cashDiscountApplied}` : ''),
      );

      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ── Get Payment for Order ─────────────────────────────────────────────────

  async getPaymentForOrder(orderId: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
