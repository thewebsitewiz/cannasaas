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
import { AeropayClient } from './aeropay.client';
import { AeropayRefundStatus, AeropayTransactionStatus } from './aeropay.types';
import { parseAeropayWebhook } from './aeropay-webhook.parser';
import { WebhookHeaders } from '../payment-processor.interface';

function mapTransactionStatus(
  s: AeropayTransactionStatus,
): PaymentTerminalStatus {
  switch (s) {
    case 'completed':
      return 'succeeded';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'pending':
    case 'requires_action':
    default:
      return 'pending';
  }
}

function mapRefundStatus(s: AeropayRefundStatus): PaymentTerminalStatus {
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

interface AeropayConfig {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly merchantId: string;
  readonly webhookSecret: string | null;
}

/**
 * Aeropay adapter — initiate / confirm / refund.
 *
 * Reads credentials from env (AEROPAY_BASE_URL, AEROPAY_API_KEY,
 * AEROPAY_MERCHANT_ID). Per-dispensary credentials are introduced in
 * sc-214 (Aeropay merchant onboarding) and will replace the env lookup
 * once both PRs merge.
 *
 * verifyWebhookSignature is intentionally left unimplemented — owned by
 * sc-213 (Aeropay webhook handler + signature verification).
 */
@Injectable()
export class AeropayPaymentProcessor implements PaymentProcessor {
  readonly name = 'aeropay' as const;

  private readonly logger = new Logger(AeropayPaymentProcessor.name);
  private readonly config: AeropayConfig | null;
  private readonly client: AeropayClient | null;

  constructor(configService: ConfigService) {
    const baseUrl = configService.get<string>('AEROPAY_BASE_URL');
    const apiKey = configService.get<string>('AEROPAY_API_KEY');
    const merchantId = configService.get<string>('AEROPAY_MERCHANT_ID');
    const webhookSecret =
      configService.get<string>('AEROPAY_WEBHOOK_SECRET') ?? null;

    if (!baseUrl || !apiKey || !merchantId) {
      this.logger.warn(
        'Aeropay env config missing — adapter will throw on use. Set AEROPAY_BASE_URL / AEROPAY_API_KEY / AEROPAY_MERCHANT_ID.',
      );
      this.config = null;
      this.client = null;
      return;
    }
    if (!webhookSecret) {
      this.logger.warn(
        'AEROPAY_WEBHOOK_SECRET is not configured — webhook verification will throw on use.',
      );
    }

    this.config = { baseUrl, apiKey, merchantId, webhookSecret };
    this.client = new AeropayClient({ baseUrl, apiKey });
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const client = this.requireClient();
    const merchantId = this.requireConfig().merchantId;
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
      status: tx.redirectUrl ? 'requires_action' : 'pending',
      redirectUrl: tx.redirectUrl,
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
        'Aeropay webhook verification requires AEROPAY_WEBHOOK_SECRET',
      );
    }
    return parseAeropayWebhook(rawBody, headers, config.webhookSecret);
  }

  /** Test seam: replace the underlying client. */
  setClient(client: AeropayClient): void {
    (this as unknown as { client: AeropayClient }).client = client;
  }

  private requireClient(): AeropayClient {
    if (!this.client) {
      throw new Error(
        'Aeropay adapter is not configured — set AEROPAY_BASE_URL, AEROPAY_API_KEY, AEROPAY_MERCHANT_ID',
      );
    }
    return this.client;
  }

  private requireConfig(): AeropayConfig {
    if (!this.config) {
      throw new Error('Aeropay adapter is not configured');
    }
    return this.config;
  }
}
