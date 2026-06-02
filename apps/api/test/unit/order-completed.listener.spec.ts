/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';

import { OrderCompletedListener } from '../../src/modules/metrc/listeners/order-completed.listener';
import { MetrcSyncQueueService } from '../../src/modules/metrc/queue/metrc-sync.queue-service';
import { OrderCompletedEvent } from '../../src/modules/orders/events/order-completed.event';

describe('OrderCompletedListener (sc-577 TC-ORDER-004)', () => {
  let listener: OrderCompletedListener;
  let enqueueSaleSync: jest.Mock;

  beforeEach(async () => {
    enqueueSaleSync = jest.fn().mockResolvedValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCompletedListener,
        { provide: MetrcSyncQueueService, useValue: { enqueueSaleSync } },
      ],
    }).compile();
    listener = module.get(OrderCompletedListener);
  });

  it('TC-ORDER-004 — order.completed event enqueues a Metrc sync for the (order, dispensary) pair', async () => {
    const event = new OrderCompletedEvent(
      'order-1',
      'd-1',
      new Date('2026-06-01T10:00:00Z'),
    );
    await listener.handleOrderCompleted(event);
    expect(enqueueSaleSync).toHaveBeenCalledTimes(1);
    expect(enqueueSaleSync).toHaveBeenCalledWith('order-1', 'd-1');
  });

  it('TC-ORDER-004 — each completed order results in exactly one enqueue (idempotency at the producer)', async () => {
    await listener.handleOrderCompleted(
      new OrderCompletedEvent('a', 'd-1', new Date()),
    );
    await listener.handleOrderCompleted(
      new OrderCompletedEvent('b', 'd-1', new Date()),
    );
    await listener.handleOrderCompleted(
      new OrderCompletedEvent('c', 'd-2', new Date()),
    );
    expect(enqueueSaleSync).toHaveBeenCalledTimes(3);
    expect(enqueueSaleSync.mock.calls[0]).toEqual(['a', 'd-1']);
    expect(enqueueSaleSync.mock.calls[1]).toEqual(['b', 'd-1']);
    expect(enqueueSaleSync.mock.calls[2]).toEqual(['c', 'd-2']);
  });
});
