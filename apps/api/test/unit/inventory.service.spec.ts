/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project (see apps/api/tsconfig.json "exclude":
// ["test"]) so Jest's globals lose their inferred types. The disables
// above match the lived-in convention of every other spec in test/unit/.

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { StockEventEmitterService } from '../../src/modules/inventory/stock-event-emitter.service';

describe('InventoryService.setReorderThreshold', () => {
  let service: InventoryService;
  let mockQuery: jest.Mock;

  const existingRow = {
    inventoryId: 'inv-1',
    variantId: 'var-1',
    dispensaryId: 'disp-1',
    quantityOnHand: '10',
    quantityReserved: '0',
    quantityAvailable: '10',
    reorderThreshold: '5',
    reorderQuantity: null,
    locationInStore: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockQuery = jest.fn();
    const mockDataSource: Partial<DataSource> = { query: mockQuery };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: StockEventEmitterService,
          useValue: { recordChange: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  it('updates the threshold and returns the refreshed row', async () => {
    // findById (existence check)
    mockQuery.mockResolvedValueOnce([existingRow]);
    // UPDATE
    mockQuery.mockResolvedValueOnce([]);
    // findById (re-read)
    mockQuery.mockResolvedValueOnce([
      { ...existingRow, reorderThreshold: '12' },
    ]);

    const result = await service.setReorderThreshold('inv-1', 12);

    expect(result.reorderThreshold).toBe('12');
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE inventory SET reorder_threshold/);
    expect(updateCall[1]).toEqual([12, 'inv-1']);
  });

  it('passes null through (clears the threshold)', async () => {
    mockQuery.mockResolvedValueOnce([existingRow]);
    mockQuery.mockResolvedValueOnce([]);
    mockQuery.mockResolvedValueOnce([
      { ...existingRow, reorderThreshold: null },
    ]);

    const result = await service.setReorderThreshold('inv-1', null);

    expect(result.reorderThreshold).toBeNull();
    expect(mockQuery.mock.calls[1][1]).toEqual([null, 'inv-1']);
  });

  it('rejects negative values', async () => {
    await expect(service.setReorderThreshold('inv-1', -3)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects non-finite values', async () => {
    await expect(
      service.setReorderThreshold('inv-1', Number.NaN),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFound when inventory row is missing', async () => {
    mockQuery.mockResolvedValueOnce([]);
    await expect(service.setReorderThreshold('missing', 5)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('InventoryService.getDispensaryTransactions', () => {
  let service: InventoryService;
  let mockQuery: jest.Mock;

  beforeEach(async () => {
    mockQuery = jest.fn().mockResolvedValue([]);
    const mockDataSource: Partial<DataSource> = { query: mockQuery };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: DataSource, useValue: mockDataSource },
        {
          provide: StockEventEmitterService,
          useValue: { recordChange: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(InventoryService);
  });

  const lastCall = (): [string, unknown[]] =>
    mockQuery.mock.calls.at(-1) as [string, unknown[]];

  it('builds a dispensary-scoped query with default limit/offset', async () => {
    await service.getDispensaryTransactions('disp-1');
    const [sql, params] = lastCall();
    expect(sql).toMatch(/FROM inventory_transactions t/);
    expect(sql).toMatch(/t.dispensary_id = \$1/);
    expect(sql).toMatch(/ORDER BY t.created_at DESC/);
    expect(params).toEqual(['disp-1', 50, 0]);
  });

  it('honors limit and offset (clamped to safe ranges)', async () => {
    await service.getDispensaryTransactions('disp-1', {
      limit: 99,
      offset: 200,
    });
    expect(lastCall()[1]).toEqual(['disp-1', 99, 200]);
  });

  it('clamps oversize limit down to 500 and negative offset up to 0', async () => {
    await service.getDispensaryTransactions('disp-1', {
      limit: 99999,
      offset: -7,
    });
    expect(lastCall()[1]).toEqual(['disp-1', 500, 0]);
  });

  it('layers since / until / transactionType / performedByUserId filters', async () => {
    const since = new Date('2026-05-01T00:00:00Z');
    const until = new Date('2026-05-22T23:59:59Z');
    await service.getDispensaryTransactions('disp-1', {
      since,
      until,
      transactionType: 'sale',
      performedByUserId: 'usr-9',
    });
    const [sql, params] = lastCall();
    expect(sql).toMatch(/t.created_at >= \$2/);
    expect(sql).toMatch(/t.created_at <= \$3/);
    expect(sql).toMatch(/t.transaction_type = \$4/);
    expect(sql).toMatch(/t.performed_by_user_id = \$5/);
    expect(params).toEqual(['disp-1', since, until, 'sale', 'usr-9', 50, 0]);
  });

  it('joins inventory + product_variants + products + users for display', async () => {
    await service.getDispensaryTransactions('disp-1');
    const [sql] = lastCall();
    expect(sql).toMatch(/LEFT JOIN inventory i ON/);
    expect(sql).toMatch(/LEFT JOIN product_variants pv ON/);
    expect(sql).toMatch(/LEFT JOIN products p ON/);
    expect(sql).toMatch(/LEFT JOIN users u ON u.id = t.performed_by_user_id/);
  });
});
