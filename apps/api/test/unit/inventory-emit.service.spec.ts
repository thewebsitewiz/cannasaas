/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { StockEventEmitterService } from '../../src/modules/inventory/stock-event-emitter.service';

const FIND_BY_ID_ROW = {
  inventoryId: 'inv-1',
  variantId: 'var-1',
  dispensaryId: 'disp-1',
  quantityOnHand: '12',
  quantityReserved: '0',
  quantityAvailable: '12',
  reorderThreshold: '5',
  reorderQuantity: null,
  locationInStore: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('InventoryService.adjustQuantity emits stock_changed (sc-578 TC-INV-001)', () => {
  let service: InventoryService;
  let mockQuery: jest.Mock;
  let recordChange: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn();
    recordChange = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DataSource, useValue: { query: mockQuery } },
        { provide: StockEventEmitterService, useValue: { recordChange } },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  it('TC-INV-001 — adjustQuantity calls stockEvents.recordChange with source=adjustment', async () => {
    // UPDATE ... RETURNING * → updated row
    mockQuery.mockResolvedValueOnce([
      {
        inventory_id: 'inv-1',
        dispensary_id: 'disp-1',
        variant_id: 'var-1',
        quantity_on_hand: '12',
        quantity_reserved: '0',
        quantity_available: '12',
      },
    ]);
    // INSERT inventory_transactions → tx row
    mockQuery.mockResolvedValueOnce([{ transactionId: 'tx-1' }]);
    // findById → returns refreshed row (uses single SELECT)
    mockQuery.mockResolvedValueOnce([FIND_BY_ID_ROW]);

    await service.adjustQuantity('inv-1', 2, 'adjustment', 'user-1');
    expect(recordChange).toHaveBeenCalledTimes(1);
    const payload = recordChange.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.source).toBe('adjustment');
    expect(payload.inventoryId).toBe('inv-1');
    expect(payload.dispensaryId).toBe('disp-1');
    expect(payload.variantId).toBe('var-1');
    expect(payload.newAvailable).toBe(12);
    expect(payload.previousAvailable).toBe(10);
    expect(payload.reorderThreshold).toBe(5);
  });
});

describe('InventoryService.reserveStock emits with source=reserve (sc-579/580 TC-INV-002/003)', () => {
  let service: InventoryService;
  let mockQuery: jest.Mock;
  let recordChange: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn();
    recordChange = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DataSource, useValue: { query: mockQuery } },
        { provide: StockEventEmitterService, useValue: { recordChange } },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  it('TC-INV-002/003 — reserveStock records a change with source=reserve and the new available qty', async () => {
    // UPDATE inventory ... → updated row (available went 10 → 4)
    mockQuery.mockResolvedValueOnce([
      {
        inventory_id: 'inv-1',
        dispensary_id: 'disp-1',
        variant_id: 'var-1',
        quantity_reserved: '6',
        quantity_available: '4',
      },
    ]);
    // INSERT inventory_transactions → tx row
    mockQuery.mockResolvedValueOnce([{ transactionId: 'tx-1' }]);
    // findById → returns refreshed row
    mockQuery.mockResolvedValueOnce([
      { ...FIND_BY_ID_ROW, quantityAvailable: '4' },
    ]);

    await service.reserveStock('inv-1', 6, 'user-1', 'order-77');
    expect(recordChange).toHaveBeenCalledTimes(1);
    const payload = recordChange.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.source).toBe('reserve');
    expect(payload.previousAvailable).toBe(10);
    expect(payload.newAvailable).toBe(4);
    expect(payload.reorderThreshold).toBe(5);
  });
});

describe('InventoryService.releaseReserve emits with source=release (sc-581 TC-INV-004)', () => {
  let service: InventoryService;
  let mockQuery: jest.Mock;
  let recordChange: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn();
    recordChange = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DataSource, useValue: { query: mockQuery } },
        { provide: StockEventEmitterService, useValue: { recordChange } },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  it('TC-INV-004 — releaseReserve calls stockEvents.recordChange with source=release', async () => {
    // UPDATE ... RETURNING releases 2 units (prev_available 4 → 6)
    mockQuery.mockResolvedValueOnce([
      {
        inventory_id: 'inv-1',
        dispensary_id: 'disp-1',
        variant_id: 'var-1',
        quantity_reserved: '4',
        quantity_available: '6',
        release_qty: '2',
        prev_available: '4',
      },
    ]);
    // INSERT inventory_transactions → tx row
    mockQuery.mockResolvedValueOnce([{ transactionId: 'tx-1' }]);
    // findById → returns refreshed row
    mockQuery.mockResolvedValueOnce([
      { ...FIND_BY_ID_ROW, quantityAvailable: '6' },
    ]);

    await service.releaseReserve('inv-1', 2, 'user-1', 'order-77');
    expect(recordChange).toHaveBeenCalledTimes(1);
    const payload = recordChange.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.source).toBe('release');
    expect(payload.previousAvailable).toBe(4);
    expect(payload.newAvailable).toBe(6);
    expect(payload.reorderThreshold).toBe(5);
  });
});
