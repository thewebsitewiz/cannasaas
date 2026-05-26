/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project (see apps/api/tsconfig.json) so Jest globals
// lose their inferred types. Matches the lived-in convention of other specs.

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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

describe('ProductsService variant CRUD (sc-682a)', () => {
  let service: ProductsService;
  let productRepo: { findOne: jest.Mock };
  let variantRepo: {
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    findOne: jest.Mock;
  };
  let qrManager: { save: jest.Mock };
  let qrQuery: jest.Mock;
  let qr: Record<string, jest.Mock>;
  let createQueryRunner: jest.Mock;

  beforeEach(async () => {
    productRepo = { findOne: jest.fn() };
    variantRepo = {
      create: jest.fn().mockImplementation((data: object) => ({
        ...data,
        variant_id: 'new-vid',
      })),
      save: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn(),
    };
    qrManager = {
      save: jest.fn().mockImplementation((_e: unknown, v: object) => v),
    };
    qrQuery = jest.fn();
    qr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      query: qrQuery,
    };
    (qr as unknown as { manager: typeof qrManager }).manager = qrManager;
    createQueryRunner = jest.fn().mockReturnValue(qr);
    const mockDataSource: Partial<DataSource> = {
      createQueryRunner,
      query: jest.fn(),
    };
    const cache = { get: jest.fn(), set: jest.fn() };

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
        { provide: CacheService, useValue: cache },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  describe('createVariant', () => {
    it('throws NotFound when the product does not exist for the dispensary', async () => {
      productRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.createVariant({
          productId: 'p-1',
          dispensaryId: 'd-1',
          name: '7g',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('saves the variant in a transaction and returns it', async () => {
      productRepo.findOne.mockResolvedValueOnce({
        id: 'p-1',
        dispensary_id: 'd-1',
      });
      const result = await service.createVariant({
        productId: 'p-1',
        dispensaryId: 'd-1',
        name: '7g',
        quantityPerUnit: 7,
      });
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qrManager.save).toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(result.name).toBe('7g');
    });

    it('inserts a price row when retailPrice is provided', async () => {
      productRepo.findOne.mockResolvedValueOnce({
        id: 'p-1',
        dispensary_id: 'd-1',
      });
      await service.createVariant({
        productId: 'p-1',
        dispensaryId: 'd-1',
        name: '7g',
        retailPrice: 80,
      });
      const priceInsert = qrQuery.mock.calls.find((c) =>
        String(c[0]).includes('INSERT INTO product_pricing'),
      );
      expect(priceInsert).toBeDefined();
      expect(priceInsert[1]).toEqual(['new-vid', 'd-1', 80]);
    });

    it('skips the price insert when retailPrice is omitted', async () => {
      productRepo.findOne.mockResolvedValueOnce({
        id: 'p-1',
        dispensary_id: 'd-1',
      });
      await service.createVariant({
        productId: 'p-1',
        dispensaryId: 'd-1',
        name: '7g',
      });
      const priceInsert = qrQuery.mock.calls.find((c) =>
        String(c[0]).includes('INSERT INTO product_pricing'),
      );
      expect(priceInsert).toBeUndefined();
    });

    it('rolls back the transaction on save failure', async () => {
      productRepo.findOne.mockResolvedValueOnce({
        id: 'p-1',
        dispensary_id: 'd-1',
      });
      qrManager.save.mockRejectedValueOnce(new Error('boom'));
      await expect(
        service.createVariant({
          productId: 'p-1',
          dispensaryId: 'd-1',
          name: '7g',
        }),
      ).rejects.toThrow('boom');
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });
  });

  describe('updateVariant', () => {
    it('throws NotFound when the variant is missing', async () => {
      variantRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.updateVariant({
          variantId: 'v-1',
          dispensaryId: 'd-1',
          name: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('applies optional fields then saves', async () => {
      const existing = {
        variant_id: 'v-1',
        dispensary_id: 'd-1',
        name: 'old',
        quantity_per_unit: 3.5,
        is_active: true,
      };
      variantRepo.findOne.mockResolvedValueOnce(existing);
      variantRepo.save.mockImplementation((v: object) => v);
      const result = await service.updateVariant({
        variantId: 'v-1',
        dispensaryId: 'd-1',
        name: 'new',
        quantityPerUnit: 7,
        sku: 'SKU-9',
        isActive: false,
      });
      expect(result.name).toBe('new');
      expect(result.quantity_per_unit).toBe(7);
      expect(result.sku).toBe('SKU-9');
      expect(result.is_active).toBe(false);
    });

    it('does NOT overwrite fields that were not supplied', async () => {
      const existing = {
        variant_id: 'v-1',
        dispensary_id: 'd-1',
        name: 'old',
        quantity_per_unit: 3.5,
        is_active: true,
      };
      variantRepo.findOne.mockResolvedValueOnce(existing);
      variantRepo.save.mockImplementation((v: object) => v);
      const result = await service.updateVariant({
        variantId: 'v-1',
        dispensaryId: 'd-1',
        name: 'new',
      });
      expect(result.quantity_per_unit).toBe(3.5);
      expect(result.is_active).toBe(true);
    });
  });

  describe('deleteVariant', () => {
    it('calls softDelete with the matching keys', async () => {
      const result = await service.deleteVariant('v-1', 'd-1');
      expect(variantRepo.softDelete).toHaveBeenCalledWith({
        variant_id: 'v-1',
        dispensary_id: 'd-1',
      });
      expect(result).toBe(true);
    });

    it('returns false when nothing was affected', async () => {
      variantRepo.softDelete.mockResolvedValueOnce({ affected: 0 });
      const result = await service.deleteVariant('v-1', 'd-1');
      expect(result).toBe(false);
    });
  });
});
