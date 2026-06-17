/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';

import { StockEventEmitterService } from '../../src/modules/inventory/stock-event-emitter.service';
import { OrderStockEventBridgeService } from '../../src/modules/orders/order-helpers';

/**
 * Sc-113: order create + cancel paths must funnel into the
 * StockEventEmitterService so `inventory.low_stock` / `out_of_stock`
 * fire on customer orders, not just manual adjustments.
 *
 * Originally tested OrdersService's private `emitStockChanges` wrapper.
 * After the tech-debt #4 split that private wrapper is gone — the
 * createOrder / cancelOrder paths call `OrderStockEventBridgeService.emit`
 * directly. Tests now drive the bridge service directly to lock down
 * the same contract.
 */
describe('OrderStockEventBridgeService.emit → StockEventEmitterService (sc-113)', () => {
  let bridge: OrderStockEventBridgeService;
  let recordChange: jest.Mock;

  beforeEach(async () => {
    recordChange = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStockEventBridgeService,
        { provide: StockEventEmitterService, useValue: { recordChange } },
      ],
    }).compile();
    bridge = module.get(OrderStockEventBridgeService);
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

    await bridge.emit(rows, 'disp-1', 'reserve');

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

    await bridge.emit(rows, 'disp-1', 'release');

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

    await expect(bridge.emit(rows, 'disp-1', 'reserve')).resolves.toBeUndefined();
  });
});
