/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Product } from '../../src/modules/products/entities/product.entity';
import { ProductVariant } from '../../src/modules/products/entities/product-variant.entity';
import { ProductPricing } from '../../src/modules/products/entities/product-pricing.entity';
import {
  LkpProductCategory,
  LkpProductType,
} from '../../src/modules/products/entities/lookups/lookups.entity';
import { CacheService } from '../../src/common/services/cache.service';
import { ProductsService } from '../../src/modules/products/products.service';

describe('ProductsService.setProductsSortOrder (sc-682c)', () => {
  let service: ProductsService;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    dsQuery = jest.fn().mockResolvedValue([]);
    const mockDataSource: Partial<DataSource> = { query: dsQuery };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: {} },
        { provide: getRepositoryToken(ProductVariant), useValue: {} },
        {
          provide: getRepositoryToken(ProductPricing),
          useValue: { findOne: jest.fn() },
        },
        { provide: getRepositoryToken(LkpProductType), useValue: {} },
        { provide: getRepositoryToken(LkpProductCategory), useValue: {} },
        { provide: DataSource, useValue: mockDataSource },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('short-circuits and returns 0 on an empty id list', async () => {
    const result = await service.setProductsSortOrder('d-1', []);
    expect(result).toBe(0);
    expect(dsQuery).not.toHaveBeenCalled();
  });

  it('issues a single UPDATE … CASE keyed by dispensary + IN ids', async () => {
    const result = await service.setProductsSortOrder('d-1', [
      'p-1',
      'p-2',
      'p-3',
    ]);
    expect(result).toBe(3);
    expect(dsQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/UPDATE products/);
    expect(sql).toMatch(/SET sort_order = CASE/);
    expect(sql).toMatch(/WHEN id = \$2 THEN 0/);
    expect(sql).toMatch(/WHEN id = \$3 THEN 1/);
    expect(sql).toMatch(/WHEN id = \$4 THEN 2/);
    expect(sql).toMatch(/dispensary_id = \$1/);
    expect(sql).toMatch(/id IN \(\$2, \$3, \$4\)/);
    expect(params).toEqual(['d-1', 'p-1', 'p-2', 'p-3']);
  });

  it('returns the count of supplied ids even when DB UPDATE returns nothing', async () => {
    dsQuery.mockResolvedValueOnce([]);
    const result = await service.setProductsSortOrder('d-1', ['p-1', 'p-2']);
    expect(result).toBe(2);
  });
});
