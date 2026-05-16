import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { CanPayPaymentProcessor } from './canpay.processor';
import { CanPayClient } from './canpay.client';
import { CanPayRefund, CanPayTransaction } from './canpay.types';

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

describe('CanPayPaymentProcessor', () => {
  let processor: CanPayPaymentProcessor;
  let client: MockClient;

  beforeEach(async () => {
    const config: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          CANPAY_BASE_URL: 'https://sandbox.example/canpay',
          CANPAY_API_KEY: 'test-key',
          CANPAY_MERCHANT_ID: 'merch-1',
        };
        return map[key];
      }) as unknown as ConfigService['get'],
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CanPayPaymentProcessor,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    processor = moduleRef.get(CanPayPaymentProcessor);
    client = buildClient();
    processor.setClient(client as unknown as CanPayClient);
  });

  it('exposes the "canpay" name', () => {
    expect(processor.name).toBe('canpay');
  });

  describe('initiate', () => {
    it('creates a transaction and returns QR-driven flow result', async () => {
      const tx: CanPayTransaction = {
        id: 'tx-100',
        status: 'awaiting_customer',
        qrPayload: 'canpay://pay/tx-100',
        expiresAt: '2026-05-16T18:00:00Z',
      };
      client.createTransaction.mockResolvedValue(tx);

      const result = await processor.initiate({
        orderId: 'order-1',
        dispensaryId: 'disp-1',
        amountCents: 2500,
        currency: 'USD',
      });

      expect(client.createTransaction).toHaveBeenCalledWith({
        merchantId: 'merch-1',
        amount: 2500,
        currency: 'USD',
        externalOrderId: 'order-1',
        customerEmail: undefined,
        metadata: undefined,
      });
      expect(result.processorTransactionId).toBe('tx-100');
      expect(result.status).toBe('requires_action');
      expect(result.qrPayload).toBe('canpay://pay/tx-100');
      expect(result.expiresAt).toEqual(new Date('2026-05-16T18:00:00Z'));
    });

    it('returns status="pending" when no QR payload is supplied', async () => {
      const tx: CanPayTransaction = { id: 'tx-101', status: 'pending' };
      client.createTransaction.mockResolvedValue(tx);

      const result = await processor.initiate({
        orderId: 'order-2',
        dispensaryId: 'disp-1',
        amountCents: 1000,
        currency: 'USD',
      });

      expect(result.status).toBe('pending');
      expect(result.qrPayload).toBeUndefined();
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
        failureReason: 'customer_declined',
      });

      const result = await processor.confirm({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
      });

      expect(result.status).toBe('failed');
      expect(result.failureReason).toBe('customer_declined');
    });

    it('maps "awaiting_customer" upstream status → "pending"', async () => {
      client.getTransaction.mockResolvedValue({
        id: 'tx-100',
        status: 'awaiting_customer',
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
      const refund: CanPayRefund = {
        id: 'r-1',
        status: 'succeeded',
        refundedAmount: 500,
      };
      client.refundTransaction.mockResolvedValue(refund);

      const result = await processor.refund({
        processorTransactionId: 'tx-100',
        dispensaryId: 'disp-1',
        amountCents: 500,
      });

      expect(client.refundTransaction).toHaveBeenCalledWith('tx-100', {
        amount: 500,
        reason: undefined,
      });
      expect(result.refundId).toBe('r-1');
      expect(result.status).toBe('succeeded');
      expect(result.refundedAmountCents).toBe(500);
    });

    it('maps pending refund status through', async () => {
      const refund: CanPayRefund = {
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

  it('verifyWebhookSignature throws — implemented in sc-216', () => {
    expect(() => processor.verifyWebhookSignature()).toThrow(/sc-216/);
  });

  it('initiate throws a helpful error when env config is missing', async () => {
    const config: Partial<ConfigService> = {
      get: jest.fn(() => undefined) as unknown as ConfigService['get'],
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CanPayPaymentProcessor,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    const unconfigured = moduleRef.get(CanPayPaymentProcessor);

    await expect(
      unconfigured.initiate({
        orderId: 'o',
        dispensaryId: 'd',
        amountCents: 100,
        currency: 'USD',
      }),
    ).rejects.toThrow(/CANPAY_/);
  });
});
