import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';

import { Payment } from '../entities/payment.entity';
import {
  PAYMENT_LIFECYCLE_EVENT,
  PaymentLifecycleEvent,
} from '../events/payment-lifecycle.event';
import { ProcessorWebhookEvent } from '../processors/payment-processor.interface';
import { PaymentLifecycleJobName } from './payment-lifecycle.queue';
import { PaymentLifecycleJobData } from './payment-lifecycle.queue-service';
import { PaymentLifecycleProcessor } from './payment-lifecycle.processor';

type MockRepo = {
  findOne: jest.Mock;
  save: jest.Mock;
};

function buildJob(
  data: PaymentLifecycleJobData,
  name: string = PaymentLifecycleJobName.HANDLE_WEBHOOK,
): Job<PaymentLifecycleJobData> {
  return { name, data } as unknown as Job<PaymentLifecycleJobData>;
}

function buildEvent(
  type: ProcessorWebhookEvent['type'],
  extras: Partial<ProcessorWebhookEvent> = {},
): ProcessorWebhookEvent {
  return {
    type,
    processorTransactionId: 'tx-100',
    raw: {},
    ...extras,
  };
}

describe('PaymentLifecycleProcessor', () => {
  let processor: PaymentLifecycleProcessor;
  let repo: MockRepo;
  let emit: jest.Mock;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((row: Payment) => Promise.resolve(row)),
    };
    emit = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentLifecycleProcessor,
        { provide: getRepositoryToken(Payment), useValue: repo },
        {
          provide: EventEmitter2,
          useValue: { emit } as unknown as EventEmitter2,
        },
      ],
    }).compile();

    processor = moduleRef.get(PaymentLifecycleProcessor);
  });

  it('ignores jobs with an unrecognized name', async () => {
    await processor.process(
      buildJob(
        {
          processor: 'aeropay',
          event: buildEvent('payment.succeeded'),
          attemptNumber: 1,
        },
        'unknown-job',
      ),
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('throws when no Payment matches (forces BullMQ retry)', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(
      processor.process(
        buildJob({
          processor: 'aeropay',
          event: buildEvent('payment.succeeded'),
          attemptNumber: 1,
        }),
      ),
    ).rejects.toThrow(/Payment not found/);
  });

  it('is a no-op when the payment is already in the target status', async () => {
    repo.findOne.mockResolvedValue({
      paymentId: 'p-1',
      orderId: 'o-1',
      dispensaryId: 'd-1',
      status: 'completed',
      processorName: 'aeropay',
      processorTransactionId: 'tx-100',
    });

    await processor.process(
      buildJob({
        processor: 'aeropay',
        event: buildEvent('payment.succeeded'),
        attemptNumber: 1,
      }),
    );

    expect(repo.save).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('transitions a pending payment to completed on payment.succeeded', async () => {
    const payment = {
      paymentId: 'p-1',
      orderId: 'o-1',
      dispensaryId: 'd-1',
      status: 'pending',
      processorName: 'aeropay',
      processorTransactionId: 'tx-100',
    };
    repo.findOne.mockResolvedValue(payment);

    await processor.process(
      buildJob({
        processor: 'aeropay',
        event: buildEvent('payment.succeeded', { amountCents: 1500 }),
        attemptNumber: 1,
      }),
    );

    expect(payment.status).toBe('completed');
    expect(repo.save).toHaveBeenCalledWith(payment);

    const expected: PaymentLifecycleEvent = {
      type: 'payment.succeeded',
      paymentId: 'p-1',
      orderId: 'o-1',
      dispensaryId: 'd-1',
      processor: 'aeropay',
      processorTransactionId: 'tx-100',
      amountCents: 1500,
      failureReason: undefined,
    };
    expect(emit).toHaveBeenCalledWith(PAYMENT_LIFECYCLE_EVENT, expected);
  });

  it('captures the failure reason on payment.failed', async () => {
    const payment = {
      paymentId: 'p-1',
      orderId: 'o-1',
      dispensaryId: 'd-1',
      status: 'pending',
      processorName: 'canpay',
      processorTransactionId: 'tx-200',
    } as Payment;
    repo.findOne.mockResolvedValue(payment);

    await processor.process(
      buildJob({
        processor: 'canpay',
        event: buildEvent('payment.failed', {
          processorTransactionId: 'tx-200',
          failureReason: 'insufficient_funds',
          raw: { reason: 'NSF' },
        }),
        attemptNumber: 1,
      }),
    );

    expect(payment.status).toBe('failed');
    expect(payment.failureReason).toBe('insufficient_funds');
    expect(emit).toHaveBeenCalledWith(
      PAYMENT_LIFECYCLE_EVENT,
      expect.objectContaining({
        type: 'payment.failed',
        failureReason: 'insufficient_funds',
      }),
    );
  });

  it('transitions to refunded on refund.succeeded', async () => {
    const payment = {
      paymentId: 'p-1',
      orderId: 'o-1',
      dispensaryId: 'd-1',
      status: 'completed',
      processorName: 'aeropay',
      processorTransactionId: 'tx-100',
    } as Payment;
    repo.findOne.mockResolvedValue(payment);

    await processor.process(
      buildJob({
        processor: 'aeropay',
        event: buildEvent('refund.succeeded'),
        attemptNumber: 1,
      }),
    );

    expect(payment.status).toBe('refunded');
  });
});
