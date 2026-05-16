import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProcessor,
  PaymentTerminalStatus,
  ProcessorWebhookEvent,
  RefundInput,
  RefundResult,
} from '../payment-processor.interface';
import { CanPayClient } from './canpay.client';
import { CanPayRefundStatus, CanPayTransactionStatus } from './canpay.types';
import { parseCanPayWebhook } from './canpay-webhook.parser';
import { WebhookHeaders } from '../payment-processor.interface';

function mapTransactionStatus(
  s: CanPayTransactionStatus,
): PaymentTerminalStatus {
  switch (s) {
    case 'completed':
      return 'succeeded';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'pending':
    case 'awaiting_customer':
    default:
      return 'pending';
  }
}

function mapRefundStatus(s: CanPayRefundStatus): PaymentTerminalStatus {
  switch (s) {
    case 'succeeded':
      return 'succeeded';
    case 'failed':
      return 'failed';
    case 'pending':
    default:
      return 'pending';
  }
}

interface CanPayConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly merchantId: string;
  readonly webhookSecret: string | null;
}

/**
 * CanPay adapter — initiate / confirm / refund.
 *
 * Reads credentials from env (CANPAY_BASE_URL, CANPAY_API_KEY,
 * CANPAY_MERCHANT_ID). Per-dispensary credentials are introduced in
 * sc-217 (CanPay merchant onboarding) and will replace the env lookup
 * once both PRs merge.
 *
 * verifyWebhookSignature is intentionally left unimplemented — owned by
 * sc-216 (CanPay webhook handler + signature verification).
 */
@Injectable()
export class CanPayPaymentProcessor implements PaymentProcessor {
  readonly name = 'canpay' as const;

  private readonly logger = new Logger(CanPayPaymentProcessor.name);
  private readonly config: CanPayConfig | null;
  private readonly client: CanPayClient | null;

  constructor(configService: ConfigService) {
    const baseUrl = configService.get<string>('CANPAY_BASE_URL');
    const apiKey = configService.get<string>('CANPAY_API_KEY');
    const merchantId = configService.get<string>('CANPAY_MERCHANT_ID');
    const webhookSecret =
      configService.get<string>('CANPAY_WEBHOOK_SECRET') ?? null;

    if (!baseUrl || !apiKey || !merchantId) {
      this.logger.warn(
        'CanPay env config missing — adapter will throw on use. Set CANPAY_BASE_URL / CANPAY_API_KEY / CANPAY_MERCHANT_ID.',
      );
      this.config = null;
      this.client = null;
      return;
    }
    if (!webhookSecret) {
      this.logger.warn(
        'CANPAY_WEBHOOK_SECRET is not configured — webhook verification will throw on use.',
      );
    }

    this.config = { baseUrl, apiKey, merchantId, webhookSecret };
    this.client = new CanPayClient({ baseUrl, apiKey });
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const client = this.requireClient();
    const { merchantId } = this.requireConfig();
    const tx = await client.createTransaction({
      merchantId,
      amount: input.amountCents,
      currency: input.currency,
      externalOrderId: input.orderId,
      customerEmail: input.customerEmail,
      metadata: input.metadata,
    });
    return {
      processorTransactionId: tx.id,
      status: tx.qrPayload ? 'requires_action' : 'pending',
      qrPayload: tx.qrPayload,
      expiresAt: tx.expiresAt ? new Date(tx.expiresAt) : undefined,
    };
  }

  async confirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    const client = this.requireClient();
    const tx = await client.getTransaction(input.processorTransactionId);
    return {
      processorTransactionId: tx.id,
      status: mapTransactionStatus(tx.status),
      capturedAmountCents: tx.capturedAmount,
      failureReason: tx.failureReason,
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const client = this.requireClient();
    const refund = await client.refundTransaction(
      input.processorTransactionId,
      { amount: input.amountCents, reason: input.reason },
    );
    return {
      refundId: refund.id,
      status: mapRefundStatus(refund.status),
      refundedAmountCents: refund.refundedAmount,
    };
  }

  verifyWebhookSignature(
    rawBody: string | Buffer,
    headers: WebhookHeaders,
  ): ProcessorWebhookEvent {
    const config = this.requireConfig();
    if (!config.webhookSecret) {
      throw new Error(
        'CanPay webhook verification requires CANPAY_WEBHOOK_SECRET',
      );
    }
    return parseCanPayWebhook(rawBody, headers, config.webhookSecret);
  }

  /** Test seam: replace the underlying client. */
  setClient(client: CanPayClient): void {
    (this as unknown as { client: CanPayClient }).client = client;
  }

  private requireClient(): CanPayClient {
    if (!this.client) {
      throw new Error(
        'CanPay adapter is not configured — set CANPAY_BASE_URL, CANPAY_API_KEY, CANPAY_MERCHANT_ID',
      );
    }
    return this.client;
  }

  private requireConfig(): CanPayConfig {
    if (!this.config) {
      throw new Error('CanPay adapter is not configured');
    }
    return this.config;
  }
}
