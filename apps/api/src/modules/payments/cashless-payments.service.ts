import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

interface PaymentMethodFlagsRow {
  is_cash_enabled: boolean | null;
  canpay_enabled: boolean | null;
  aeropay_enabled: boolean | null;
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

@Injectable()
export class CashlessPaymentsService {
  private readonly logger = new Logger(CashlessPaymentsService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  // ── CanPay ACH Integration ──────────────────────────────────────────────

  initializeCanPayPayment(
    orderId: string,
    amount: number,
  ): Promise<{ redirectUrl: string; transactionId: string }> {
    const transactionId = `CANPAY-${crypto.randomUUID().substring(0, 12).toUpperCase()}`;
    this.logger.log(
      `CanPay payment initialized: order=${orderId} amount=$${amount} txn=${transactionId}`,
    );

    // Stub: In production, this would call the CanPay API
    return Promise.resolve({
      redirectUrl: `https://canpaydebit.com/pay?txn=${transactionId}&amount=${amount}`,
      transactionId,
    });
  }

  // ── AeroPay Debit Integration ───────────────────────────────────────────

  initializeAeroPayPayment(
    orderId: string,
    amount: number,
  ): Promise<{ paymentUrl: string; referenceId: string }> {
    const referenceId = `AERO-${crypto.randomUUID().substring(0, 12).toUpperCase()}`;
    this.logger.log(
      `AeroPay payment initialized: order=${orderId} amount=$${amount} ref=${referenceId}`,
    );

    // Stub: In production, this would call the AeroPay API
    return Promise.resolve({
      paymentUrl: `https://aeropay.com/checkout?ref=${referenceId}&amount=${amount}`,
      referenceId,
    });
  }

  // ── Webhooks ────────────────────────────────────────────────────────────

  async handleCanPayWebhook(payload: {
    transactionId: string;
    status: string;
    orderId?: string;
  }): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `CanPay webhook: txn=${payload.transactionId} status=${payload.status}`,
    );

    if (payload.orderId && payload.status === 'completed') {
      await this.dataSource.query(
        `UPDATE orders SET payment_method = 'canpay', "updatedAt" = NOW() WHERE "orderId" = $1`,
        [payload.orderId],
      );
    }

    return {
      success: true,
      message: `CanPay webhook processed: ${payload.status}`,
    };
  }

  async handleAeroPayWebhook(payload: {
    referenceId: string;
    status: string;
    orderId?: string;
  }): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `AeroPay webhook: ref=${payload.referenceId} status=${payload.status}`,
    );

    if (payload.orderId && payload.status === 'completed') {
      await this.dataSource.query(
        `UPDATE orders SET payment_method = 'aeropay', "updatedAt" = NOW() WHERE "orderId" = $1`,
        [payload.orderId],
      );
    }

    return {
      success: true,
      message: `AeroPay webhook processed: ${payload.status}`,
    };
  }

  // ── Available Methods ───────────────────────────────────────────────────

  async getAvailablePaymentMethods(
    dispensaryId: string,
  ): Promise<{ method: string; enabled: boolean }[]> {
    const rows = await rawQuery<PaymentMethodFlagsRow>(
      this.dataSource,
      `SELECT is_cash_enabled, canpay_enabled, aeropay_enabled
       FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = rows[0];
    if (!disp) throw new NotFoundException('Dispensary not found');

    return [
      { method: 'cash', enabled: disp.is_cash_enabled ?? true },
      { method: 'canpay', enabled: disp.canpay_enabled ?? false },
      { method: 'aeropay', enabled: disp.aeropay_enabled ?? false },
    ];
  }
}
