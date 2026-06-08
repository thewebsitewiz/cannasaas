/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { OrdersService } from '../../src/modules/orders/orders.service';
import { StockEventEmitterService } from '../../src/modules/inventory/stock-event-emitter.service';

/**
 * Sc-113: order create + cancel paths must funnel into the
 * StockEventEmitterService so `inventory.low_stock` / `out_of_stock`
 * fire on customer orders, not just manual adjustments.
 *
 * Full createOrder path is too thick to mock here; we drive the new
 * helper `emitStockChanges` directly to lock down its contract.
 */
describe('OrdersService.emitStockChanges → StockEventEmitterService (sc-113)', () => {
  let service: OrdersService;
  let recordChange: jest.Mock;

  beforeEach(async () => {
    recordChange = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DataSource, useValue: { query: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: StockEventEmitterService, useValue: { recordChange } },
      ],
    }).compile();
    service = module.get(OrdersService);
  });

  it('TC-INV-LS-001 — converts each RETURNING row into a recordChange call with parsed numerics', async () => {
    const rows = [
      {
        inventory_id: 'inv-1',
        variant_id: 'var-A',
        new_available: '4',
        prev_available: '10',
        reorder_threshold: '5',
      },
      {
        inventory_id: 'inv-2',
        variant_id: 'var-B',
        new_available: '0',
        prev_available: '2',
        reorder_threshold: '3',
      },
    ];

    await (service as unknown as {
      emitStockChanges: (
        r: typeof rows,
        d: string,
        s: 'reserve' | 'release' | 'adjustment',
      ) => Promise<void>;
    }).emitStockChanges(rows, 'disp-1', 'reserve');

    expect(recordChange).toHaveBeenCalledTimes(2);
    expect(recordChange.mock.calls[0][0]).toEqual({
      dispensaryId: 'disp-1',
      inventoryId: 'inv-1',
      variantId: 'var-A',
      previousAvailable: 10,
      newAvailable: 4,
      reorderThreshold: 5,
      source: 'reserve',
    });
    expect(recordChange.mock.calls[1][0]).toEqual({
      dispensaryId: 'disp-1',
      inventoryId: 'inv-2',
      variantId: 'var-B',
      previousAvailable: 2,
      newAvailable: 0,
      reorderThreshold: 3,
      source: 'reserve',
    });
  });

  it('TC-INV-LS-002 — null reorder_threshold round-trips as null (no threshold configured)', async () => {
    const rows = [
      {
        inventory_id: 'inv-3',
        variant_id: 'var-C',
        new_available: '7',
        prev_available: '8',
        reorder_threshold: null,
      },
    ];

    await (service as unknown as {
      emitStockChanges: (
        r: typeof rows,
        d: string,
        s: 'reserve' | 'release' | 'adjustment',
      ) => Promise<void>;
    }).emitStockChanges(rows, 'disp-1', 'release');

    expect(recordChange).toHaveBeenCalledTimes(1);
    expect(recordChange.mock.calls[0][0].reorderThreshold).toBeNull();
    expect(recordChange.mock.calls[0][0].source).toBe('release');
  });

  it('TC-INV-LS-003 — swallows recordChange rejections so the order is not unwound', async () => {
    recordChange.mockRejectedValueOnce(new Error('emitter blew up'));

    const rows = [
      {
        inventory_id: 'inv-4',
        variant_id: 'var-D',
        new_available: '1',
        prev_available: '2',
        reorder_threshold: '3',
      },
    ];

    await expect(
      (service as unknown as {
        emitStockChanges: (
          r: typeof rows,
          d: string,
          s: 'reserve' | 'release' | 'adjustment',
        ) => Promise<void>;
      }).emitStockChanges(rows, 'disp-1', 'reserve'),
    ).resolves.toBeUndefined();
  });
});
