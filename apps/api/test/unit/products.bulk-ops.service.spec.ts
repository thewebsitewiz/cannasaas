/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types. Matches the
// lived-in convention of every other spec in test/unit/.

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

describe('ProductsService bulk-ops (sc-682b)', () => {
  let service: ProductsService;
  let productRepo: {
    createQueryBuilder: jest.Mock;
    softDelete: jest.Mock;
  };
  let qbExecute: jest.Mock;
  let qb: Record<string, jest.Mock>;

  beforeEach(async () => {
    qbExecute = jest.fn().mockResolvedValue({ affected: 0 });
    qb = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: qbExecute,
    };
    productRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const variantRepo = {};
    const mockDataSource: Partial<DataSource> = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductVariant), useValue: variantRepo },
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

  describe('setProductsActive', () => {
    it('short-circuits and returns 0 on an empty id list', async () => {
      const result = await service.setProductsActive('d-1', [], true);
      expect(result).toBe(0);
      expect(productRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('builds an UPDATE keyed on (dispensary, IN ids) with the supplied isActive', async () => {
      qbExecute.mockResolvedValueOnce({ affected: 3 });
      const result = await service.setProductsActive(
        'd-1',
        ['p-1', 'p-2', 'p-3'],
        false,
      );
      expect(result).toBe(3);
      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalledWith({ is_active: false });
      const whereCall = qb.where.mock.calls[0];
      expect(whereCall[0]).toMatch(/dispensary_id\s*=\s*:dispensaryId/);
      expect(whereCall[0]).toMatch(/id IN \(:\.\.\.productIds\)/);
      expect(whereCall[1]).toEqual({
        dispensaryId: 'd-1',
        productIds: ['p-1', 'p-2', 'p-3'],
      });
    });

    it('returns 0 when execute reports no affected rows', async () => {
      qbExecute.mockResolvedValueOnce({});
      const result = await service.setProductsActive('d-1', ['p-1'], true);
      expect(result).toBe(0);
    });
  });

  describe('deleteProducts', () => {
    it('short-circuits and returns 0 on an empty id list', async () => {
      const result = await service.deleteProducts('d-1', []);
      expect(result).toBe(0);
      expect(productRepo.softDelete).not.toHaveBeenCalled();
    });

    it('softDeletes each (dispensary, id) and sums affected rows', async () => {
      productRepo.softDelete
        .mockResolvedValueOnce({ affected: 1 })
        .mockResolvedValueOnce({ affected: 1 })
        .mockResolvedValueOnce({ affected: 0 });
      const result = await service.deleteProducts('d-1', ['p-1', 'p-2', 'p-3']);
      expect(result).toBe(2);
      expect(productRepo.softDelete).toHaveBeenNthCalledWith(1, {
        id: 'p-1',
        dispensary_id: 'd-1',
      });
      expect(productRepo.softDelete).toHaveBeenNthCalledWith(2, {
        id: 'p-2',
        dispensary_id: 'd-1',
      });
      expect(productRepo.softDelete).toHaveBeenNthCalledWith(3, {
        id: 'p-3',
        dispensary_id: 'd-1',
      });
    });
  });
});
