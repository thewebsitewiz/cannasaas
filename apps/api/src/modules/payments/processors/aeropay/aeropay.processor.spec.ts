import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

import { AeropayPaymentProcessor } from './aeropay.processor';
import { AeropayClient } from './aeropay.client';
import { AeropayRefund, AeropayTransaction } from './aeropay.types';
import { AEROPAY_SIGNATURE_HEADER } from './aeropay-webhook.parser';

type MockClient = {
  createTransaction: jest.Mock;
  getTransaction: jest.Mock;
  refundTransaction: jest.Mock;
};

function buildClient(): MockClient {
  return {
    createTransaction: jest.fn(),
    getTransaction: jest.fn(),
    refundTransaction: jest.fn(),
  };
}

describe('AeropayPaymentProcessor', () => {
  let processor: AeropayPaymentProcessor;
  let client: MockClient;

  beforeEach(async () => {
    const config: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          AEROPAY_BASE_URL: 'https://sandbox.example/aeropay',
          AEROPAY_API_KEY: 'test-key',
          AEROPAY_MERCHANT_ID: 'merch-1',
          AEROPAY_WEBHOOK_SECRET: 'webhook-secret',
        };
        return map[key];
      }) as unknown as ConfigService['get'],
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AeropayPaymentProcessor,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    processor = moduleRef.get(AeropayPaymentProcessor);
    client = buildClient();
    processor.setClient(client as unknown as AeropayClient);
  });

  it('exposes the "aeropay" name', () => {
    expect(processor.name).toBe('aeropay');
  });

  describe('initiate', () => {
    it('creates a transaction and returns redirect-driven flow result', async () => {
      const tx: AeropayTransaction = {
        id: 'tx-100',
        status: 'requires_action',
        redirectUrl: 'https://aeropay.example/pay/tx-100',
        expiresAt: '2026-05-15T18:00:00Z',
      };
      client.createTransaction.mockResolvedValue(tx);

      const result = await processor.initiate({
        orderId: 'order-1',
        dispensaryId: 'disp-1',
        amountCents: 2500,
        currency: 'USD',
        customerEmail: 'c@example.com',
      });

      expect(client.createTransaction).toHaveBeenCalledWith({
        merchantId: 'merch-1',
        amount: 2500,
        currency: 'USD',
        externalOrderId: 'order-1',
        customerEmail: 'c@example.com',
        metadata: undefined,
      });
      expect(result.processorTransactionId).toBe('tx-100');
      expect(result.status).toBe('requires_action');
      expect(result.redirectUrl).toBe('https://aeropay.example/pay/tx-100');
      expect(result.expiresAt).toEqual(new Date('2026-05-15T18:00:00Z'));
    });

    it('returns status="pending" when no redirect URL is supplied', async () => {
      const tx: AeropayTransaction = {
        id: 'tx-101',
        status: 'pending',
      };
      client.createTransaction.mockResolvedValue(tx);

      const result = await processor.initiate({
        orderId: 'order-2',
        dispensaryId: 'disp-1',
        amountCents: 1000,
        currency: 'USD',
      });

      expect(result.status).toBe('pending');
      expect(result.redirectUrl).toBeUndefined();
    });
  });

  describe('confirm', () => {
    it('maps "completed" upstream status → "succeeded"', async () => {
      client.getTransaction.mockResolvedValue({
        id: 'tx-100',
        status: 'completed',
        capturedAmount: 2500,
      });

      const result = await processor.confirm({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
      });

      expect(result.status).toBe('succeeded');
      expect(result.capturedAmountCents).toBe(2500);
    });

    it('maps "failed" upstream status → "failed" and forwards failureReason', async () => {
      client.getTransaction.mockResolvedValue({
        id: 'tx-100',
        status: 'failed',
        failureReason: 'insufficient_funds',
      });

      const result = await processor.confirm({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
      });

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('insufficient_funds');
    });

    it('maps "requires_action" upstream status → "pending"', async () => {
      client.getTransaction.mockResolvedValue({
        id: 'tx-100',
        status: 'requires_action',
      });

      const result = await processor.confirm({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
      });

      expect(result.status).toBe('pending');
    });
  });

  describe('refund', () => {
    it('refunds the requested amount and returns the refund id', async () => {
      const refund: AeropayRefund = {
        id: 'r-1',
        status: 'succeeded',
        refundedAmount: 500,
      };
      client.refundTransaction.mockResolvedValue(refund);

      const result = await processor.refund({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
        amountCents: 500,
        reason: 'customer_request',
      });

      expect(client.refundTransaction).toHaveBeenCalledWith('tx-100', {
        amount: 500,
        reason: 'customer_request',
      });
      expect(result.refundId).toBe('r-1');
      expect(result.status).toBe('succeeded');
      expect(result.refundedAmountCents).toBe(500);
    });

    it('maps pending refund status through', async () => {
      const refund: AeropayRefund = {
        id: 'r-2',
        status: 'pending',
        refundedAmount: 250,
      };
      client.refundTransaction.mockResolvedValue(refund);

      const result = await processor.refund({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
        amountCents: 250,
      });

      expect(result.status).toBe('pending');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('verifies a signed webhook end-to-end through the parser', () => {
      const body = JSON.stringify({
        type: 'transaction.completed',
        transactionId: 'tx-9',
        amount: 1234,
      });
      const sig = createHmac('sha256', 'webhook-secret')
        .update(body)
        .digest('hex');

      const event = processor.verifyWebhookSignature(body, {
        [AEROPAY_SIGNATURE_HEADER]: sig,
      });

      expect(event.type).toBe('payment.succeeded');
      expect(event.processorTransactionId).toBe('tx-9');
      expect(event.amountCents).toBe(1234);
    });

    it('throws on a bad signature', () => {
      const body = JSON.stringify({
        type: 'transaction.completed',
        transactionId: 'tx-9',
      });
      expect(() =>
        processor.verifyWebhookSignature(body, {
          [AEROPAY_SIGNATURE_HEADER]: 'definitely-wrong',
        }),
      ).toThrow();
    });
  });

  it('initiate throws a helpful error when env config is missing', async () => {
    const config: Partial<ConfigService> = {
      get: jest.fn(() => undefined) as unknown as ConfigService['get'],
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AeropayPaymentProcessor,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    const unconfigured = moduleRef.get(AeropayPaymentProcessor);

    await expect(
      unconfigured.initiate({
        orderId: 'o',
        dispensaryId: 'd',
        amountCents: 100,
        currency: 'USD',
      }),
    ).rejects.toThrow(/AEROPAY_/);
  });
});
