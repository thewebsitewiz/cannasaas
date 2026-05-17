import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';

import { StockEventEmitterService } from './stock-event-emitter.service';
import {
  STOCK_CHANGED_EVENT,
  STOCK_LOW_EVENT,
  STOCK_OUT_EVENT,
} from './stock-events';

interface RecordedEmit {
  event: string;
  payload: unknown;
}

describe('StockEventEmitterService', () => {
  let service: StockEventEmitterService;
  let emitted: RecordedEmit[];
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    emitted = [];
    dsQuery = jest.fn(() => Promise.resolve([{ name: 'Blue Dream 1g' }]));

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StockEventEmitterService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: (event: string, payload: unknown) => {
              emitted.push({ event, payload });
              return true;
            },
          } as unknown as EventEmitter2,
        },
        {
          provide: DataSource,
          useValue: { query: dsQuery } as unknown as DataSource,
        },
      ],
    }).compile();

    service = moduleRef.get(StockEventEmitterService);
  });

  const base = {
    dispensaryId: 'd-1',
    inventoryId: 'i-1',
    variantId: 'v-1',
    source: 'adjustment' as const,
  };

  it('emits stock_changed on every change', async () => {
    await service.recordChange({
      ...base,
      previousAvailable: 100,
      newAvailable: 90,
      reorderThreshold: 5,
    });
    expect(emitted).toHaveLength(1);
    expect(emitted[0].event).toBe(STOCK_CHANGED_EVENT);
    expect(emitted[0].payload).toMatchObject({
      previousAvailable: 100,
      newAvailable: 90,
      status: 'in_stock',
      productName: 'Blue Dream 1g',
      source: 'adjustment',
    });
  });

  it('emits low_stock on crossover above → at-or-below threshold', async () => {
    await service.recordChange({
      ...base,
      previousAvailable: 10,
      newAvailable: 5,
      reorderThreshold: 5,
    });
    expect(emitted.map((e) => e.event)).toEqual([
      STOCK_CHANGED_EVENT,
      STOCK_LOW_EVENT,
    ]);
    expect(emitted[1].payload).toEqual({
      dispensaryId: 'd-1',
      productName: 'Blue Dream 1g',
      quantity: 5,
    });
  });

  it('does NOT emit low_stock when already below threshold (no crossover)', async () => {
    await service.recordChange({
      ...base,
      previousAvailable: 3,
      newAvailable: 2,
      reorderThreshold: 5,
    });
    expect(emitted.map((e) => e.event)).toEqual([STOCK_CHANGED_EVENT]);
  });

  it('emits out_of_stock on non-zero → zero crossover', async () => {
    await service.recordChange({
      ...base,
      previousAvailable: 1,
      newAvailable: 0,
      reorderThreshold: 5,
    });
    expect(emitted.map((e) => e.event)).toEqual([
      STOCK_CHANGED_EVENT,
      STOCK_OUT_EVENT,
    ]);
  });

  it('does NOT re-emit out_of_stock when already at zero', async () => {
    await service.recordChange({
      ...base,
      previousAvailable: 0,
      newAvailable: 0,
      reorderThreshold: 5,
    });
    expect(emitted.map((e) => e.event)).toEqual([STOCK_CHANGED_EVENT]);
  });

  it('falls back to "Unknown product" when the variant lookup fails', async () => {
    dsQuery.mockRejectedValue(new Error('db boom'));
    await service.recordChange({
      ...base,
      previousAvailable: 10,
      newAvailable: 9,
      reorderThreshold: null,
    });
    expect(emitted[0].payload).toMatchObject({
      productName: 'Unknown product',
    });
  });

  it('falls back to "Unknown product" when the lookup returns no rows', async () => {
    dsQuery.mockResolvedValue([]);
    await service.recordChange({
      ...base,
      previousAvailable: 10,
      newAvailable: 9,
      reorderThreshold: null,
    });
    expect(emitted[0].payload).toMatchObject({
      productName: 'Unknown product',
    });
  });

  it('treats null threshold as "no low-stock check" — never fires low_stock', async () => {
    await service.recordChange({
      ...base,
      previousAvailable: 10,
      newAvailable: 1,
      reorderThreshold: null,
    });
    expect(emitted.map((e) => e.event)).toEqual([STOCK_CHANGED_EVENT]);
  });
});
