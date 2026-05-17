import { Test, TestingModule } from '@nestjs/testing';

import { PaymentWebhookListener } from './payment-webhook.listener';
import { PaymentLifecycleQueueService } from '../queue/payment-lifecycle.queue-service';
import { ProcessorWebhookEvent } from '../processors/payment-processor.interface';

describe('PaymentWebhookListener', () => {
  let listener: PaymentWebhookListener;
  let enqueueWebhookEvent: jest.Mock;

  beforeEach(async () => {
    enqueueWebhookEvent = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentWebhookListener,
        {
          provide: PaymentLifecycleQueueService,
          useValue: {
            enqueueWebhookEvent,
          } as unknown as PaymentLifecycleQueueService,
        },
      ],
    }).compile();

    listener = moduleRef.get(PaymentWebhookListener);
  });

  it('forwards the (processor, event) pair to the queue service', async () => {
    const event: ProcessorWebhookEvent = {
      type: 'payment.succeeded',
      processorTransactionId: 'tx-42',
      amountCents: 2500,
      raw: {},
    };

    await listener.handle({ processor: 'aeropay', event });

    expect(enqueueWebhookEvent).toHaveBeenCalledWith('aeropay', event);
  });
});
