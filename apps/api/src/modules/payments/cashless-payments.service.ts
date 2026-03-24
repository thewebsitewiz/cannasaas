import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class CashlessPaymentsService {
  private readonly logger = new Logger(CashlessPaymentsService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ── CanPay ACH Integration ──────────────────────────────────────────────

  async initializeCanPayPayment(
    orderId: string,
    amount: number,
  ): Promise<{ redirectUrl: string; transactionId: string }> {
    const transactionId = `CANPAY-${crypto.randomUUID().substring(0, 12).toUpperCase()}`;
    this.logger.log(`CanPay payment initialized: order=${orderId} amount=$${amount} txn=${transactionId}`);

    // Stub: In production, this would call the CanPay API
    return {
      redirectUrl: `https://canpaydebit.com/pay?txn=${transactionId}&amount=${amount}`,
      transactionId,
    };
  }

  // ── AeroPay Debit Integration ───────────────────────────────────────────

  async initializeAeroPayPayment(
    orderId: string,
    amount: number,
  ): Promise<{ paymentUrl: string; referenceId: string }> {
    const referenceId = `AERO-${crypto.randomUUID().substring(0, 12).toUpperCase()}`;
    this.logger.log(`AeroPay payment initialized: order=${orderId} amount=$${amount} ref=${referenceId}`);

    // Stub: In production, this would call the AeroPay API
    return {
      paymentUrl: `https://aeropay.com/checkout?ref=${referenceId}&amount=${amount}`,
      referenceId,
    };
  }

  // ── Webhooks ────────────────────────────────────────────────────────────

  async handleCanPayWebhook(payload: {
    transactionId: string;
    status: string;
    orderId?: string;
  }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`CanPay webhook: txn=${payload.transactionId} status=${payload.status}`);

    if (payload.orderId && payload.status === 'completed') {
      await this._q(
        `UPDATE orders SET payment_method = 'canpay', "updatedAt" = NOW() WHERE "orderId" = $1`,
        [payload.orderId],
      );
    }

    return { success: true, message: `CanPay webhook processed: ${payload.status}` };
  }

  async handleAeroPayWebhook(payload: {
    referenceId: string;
    status: string;
    orderId?: string;
  }): Promise<{ success: boolean; message: string }> {
    this.logger.log(`AeroPay webhook: ref=${payload.referenceId} status=${payload.status}`);

    if (payload.orderId && payload.status === 'completed') {
      await this._q(
        `UPDATE orders SET payment_method = 'aeropay', "updatedAt" = NOW() WHERE "orderId" = $1`,
        [payload.orderId],
      );
    }

    return { success: true, message: `AeroPay webhook processed: ${payload.status}` };
  }

  // ── Available Methods ───────────────────────────────────────────────────

  async getAvailablePaymentMethods(
    dispensaryId: string,
  ): Promise<{ method: string; enabled: boolean }[]> {
    const [disp] = await this._q(
      `SELECT is_cash_enabled, canpay_enabled, aeropay_enabled, stripe_enabled
       FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    if (!disp) throw new NotFoundException('Dispensary not found');

    return [
      { method: 'cash', enabled: disp.is_cash_enabled ?? true },
      { method: 'stripe', enabled: disp.stripe_enabled ?? false },
      { method: 'canpay', enabled: disp.canpay_enabled ?? false },
      { method: 'aeropay', enabled: disp.aeropay_enabled ?? false },
    ];
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
