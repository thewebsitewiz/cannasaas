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
