import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PAYMENT_PROCESSOR,
  PaymentProcessor,
  RefundInput,
  RefundResult,
} from './payment-processor.interface';
import { PaymentProcessorRegistry } from './payment-processor.registry';
import { NoopPaymentProcessor } from './noop.processor';

class FakeAeropayProcessor implements PaymentProcessor {
  readonly name = 'aeropay' as const;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return Promise.resolve({
      processorTransactionId: `aero-${input.orderId}`,
      status: 'pending',
      redirectUrl: 'https://aeropay.example/pay',
    });
  }
  confirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    return Promise.resolve({
      processorTransactionId: input.processorTransactionId,
      status: 'succeeded',
    });
  }
  refund(input: RefundInput): Promise<RefundResult> {
    return Promise.resolve({
      refundId: 'aero-refund',
      status: 'succeeded',
      refundedAmountCents: input.amountCents,
    });
  }
  verifyWebhookSignature(): never {
    throw new Error('not implemented in fake');
  }
}

describe('PaymentProcessorRegistry', () => {
  describe('with a single noop processor', () => {
    let registry: PaymentProcessorRegistry;

    beforeEach(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          NoopPaymentProcessor,
          {
            provide: PAYMENT_PROCESSOR,
            useFactory: (noop: NoopPaymentProcessor) => [noop],
            inject: [NoopPaymentProcessor],
          },
          PaymentProcessorRegistry,
        ],
      }).compile();
      registry = moduleRef.get(PaymentProcessorRegistry);
    });

    it('lists the registered processor name', () => {
      expect(registry.list()).toEqual(['noop']);
    });

    it('resolves noop by name', () => {
      const processor = registry.get('noop');
      expect(processor.name).toBe('noop');
    });

    it('throws NotFoundException for an unregistered processor', () => {
      expect(() => registry.get('aeropay')).toThrow(NotFoundException);
    });

    it('reports presence via has()', () => {
      expect(registry.has('noop')).toBe(true);
      expect(registry.has('aeropay')).toBe(false);
    });
  });

  describe('with multiple processors', () => {
    let registry: PaymentProcessorRegistry;

    beforeEach(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          NoopPaymentProcessor,
          FakeAeropayProcessor,
          {
            provide: PAYMENT_PROCESSOR,
            useFactory: (
              noop: NoopPaymentProcessor,
              aeropay: FakeAeropayProcessor,
            ) => [noop, aeropay],
            inject: [NoopPaymentProcessor, FakeAeropayProcessor],
          },
          PaymentProcessorRegistry,
        ],
      }).compile();
      registry = moduleRef.get(PaymentProcessorRegistry);
    });

    it('resolves each by name', () => {
      expect(registry.get('noop').name).toBe('noop');
      expect(registry.get('aeropay').name).toBe('aeropay');
    });

    it('lists both names in registration order', () => {
      expect(registry.list()).toEqual(['noop', 'aeropay']);
    });
  });

  it('throws on duplicate registration of the same name', () => {
    const noopA = new NoopPaymentProcessor();
    const noopB = new NoopPaymentProcessor();
    expect(() => new PaymentProcessorRegistry([noopA, noopB])).toThrow(
      /Duplicate PaymentProcessor/,
    );
  });

  describe('NoopPaymentProcessor', () => {
    let noop: NoopPaymentProcessor;
    beforeEach(() => {
      noop = new NoopPaymentProcessor();
    });

    it('initiates with the orderId-derived transaction id', async () => {
      const result = await noop.initiate({
        orderId: 'order-123',
        dispensaryId: 'disp-1',
        amountCents: 1000,
        currency: 'USD',
      });
      expect(result.processorTransactionId).toBe('noop-order-123');
      expect(result.status).toBe('pending');
    });

    it('confirm always returns succeeded', async () => {
      const result = await noop.confirm({
        processorTransactionId: 'tx-1',
        dispensaryId: 'disp-1',
      });
      expect(result.status).toBe('succeeded');
    });

    it('refund echoes amount as refunded', async () => {
      const result = await noop.refund({
        processorTransactionId: 'tx-1',
        dispensaryId: 'disp-1',
        amountCents: 500,
      });
      expect(result.refundedAmountCents).toBe(500);
      expect(result.status).toBe('succeeded');
    });

    it('verifyWebhookSignature throws', () => {
      expect(() => noop.verifyWebhookSignature()).toThrow();
    });
  });
});
