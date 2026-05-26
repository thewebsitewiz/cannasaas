/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { Inventory } from '../../src/modules/inventory/entities/inventory.entity';
import { InventoryTransaction } from '../../src/modules/inventory/entities/inventory-transaction.entity';
import { StockEventEmitterService } from '../../src/modules/inventory/stock-event-emitter.service';

describe('InventoryService.countDispensaryTransactions (sc-690)', () => {
  let service: InventoryService;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    dsQuery = jest.fn().mockResolvedValue([{ count: 247 }]);
    const mockDataSource: Partial<DataSource> = { query: dsQuery };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(Inventory), useValue: {} },
        { provide: getRepositoryToken(InventoryTransaction), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
        { provide: StockEventEmitterService, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(InventoryService);
  });

  it('returns COUNT(*) for the dispensary with no filters', async () => {
    const n = await service.countDispensaryTransactions('disp-1');
    expect(n).toBe(247);
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/COUNT\(\*\)/);
    expect(sql).toMatch(/t\.dispensary_id = \$1/);
    expect(params).toEqual(['disp-1']);
  });

  it('appends since + until + type + performedByUserId clauses in param order', async () => {
    await service.countDispensaryTransactions('disp-1', {
      since: new Date('2026-05-01T00:00:00Z'),
      until: new Date('2026-05-31T23:59:59Z'),
      transactionType: 'sale',
      performedByUserId: 'u-9',
    });
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/t\.created_at >= \$2/);
    expect(sql).toMatch(/t\.created_at <= \$3/);
    expect(sql).toMatch(/t\.transaction_type = \$4/);
    expect(sql).toMatch(/t\.performed_by_user_id = \$5/);
    expect(params).toEqual([
      'disp-1',
      new Date('2026-05-01T00:00:00Z'),
      new Date('2026-05-31T23:59:59Z'),
      'sale',
      'u-9',
    ]);
  });

  it('parses string counts (pg may return strings on older drivers)', async () => {
    dsQuery.mockResolvedValueOnce([{ count: '42' }]);
    const n = await service.countDispensaryTransactions('disp-1');
    expect(n).toBe(42);
  });

  it('returns 0 when the count row is missing', async () => {
    dsQuery.mockResolvedValueOnce([]);
    const n = await service.countDispensaryTransactions('disp-1');
    expect(n).toBe(0);
  });

  it('returns 0 when the count value is not finite', async () => {
    dsQuery.mockResolvedValueOnce([{ count: 'not-a-number' }]);
    const n = await service.countDispensaryTransactions('disp-1');
    expect(n).toBe(0);
  });
});
