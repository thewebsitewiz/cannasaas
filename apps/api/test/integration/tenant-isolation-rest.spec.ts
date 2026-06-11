import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Response } from 'express';

import { ReportController } from '../../src/modules/reporting/report.controller';
import { ReportingService } from '../../src/modules/reporting/reporting.service';
import { PayrollController } from '../../src/modules/timeclock/payroll.controller';
import { TimeClockService } from '../../src/modules/timeclock/timeclock.service';
import { ImageController } from '../../src/modules/image/image.controller';
import { DispensaryOwnershipService } from '../../src/common/services/dispensary-ownership.service';
import { ImageService } from '../../src/modules/image/image.service';
import { JwtPayload } from '../../src/modules/auth/strategies/jwt.strategy';

/**
 * REST-side tenant-isolation runtime contract (sc-609 follow-up).
 *
 * Covers the 8 cross-tenant leaks the audit found in REST controllers
 * that the original sc-609 GraphQL-focused work missed:
 *   - 4 report CSVs (sales, tax, staff, inventory)
 *   - payroll export
 *   - 3 product image endpoints (POST, gallery POST, DELETE)
 *
 * The role-and-tenant guard pattern is the same as the GraphQL side:
 * `user.role !== 'super_admin' && user.dispensaryId !== <arg>` → 403.
 */

function tenantAdmin(dispensaryId: string): JwtPayload {
  return {
    sub: `u-${dispensaryId}`,
    email: `admin@${dispensaryId}.test`,
    role: 'dispensary_admin',
    dispensaryId,
  };
}

function fakeResponse(): Response {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('REST tenant isolation — sc-609 follow-up', () => {
  describe('ReportController', () => {
    let controller: ReportController;
    let svc: { [k: string]: jest.Mock };

    beforeEach(async () => {
      svc = {
        generateSalesCsv: jest.fn(() => Promise.resolve('csv')),
        generateTaxCsv: jest.fn(() => Promise.resolve('csv')),
        generateStaffCsv: jest.fn(() => Promise.resolve('csv')),
        generateInventoryCsv: jest.fn(() => Promise.resolve('csv')),
      };
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          ReportController,
          { provide: ReportingService, useValue: svc },
        ],
        controllers: [],
      })
        .overrideProvider(ReportController)
        .useFactory({
          factory: (s: ReportingService) => new ReportController(s),
          inject: [ReportingService],
        })
        .compile();
      controller = moduleRef.get(ReportController);
    });

    it('sales CSV rejects cross-dispensary read', async () => {
      await expect(
        controller.salesCsv(
          'disp-b',
          '2026-01-01',
          '2026-01-31',
          tenantAdmin('disp-a'),
          fakeResponse(),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(svc['generateSalesCsv']).not.toHaveBeenCalled();
    });

    it('tax CSV rejects cross-dispensary read', async () => {
      await expect(
        controller.taxCsv(
          'disp-b',
          '2026-01-01',
          '2026-01-31',
          tenantAdmin('disp-a'),
          fakeResponse(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('staff CSV rejects cross-dispensary read', async () => {
      await expect(
        controller.staffCsv(
          'disp-b',
          '2026-01-01',
          '2026-01-31',
          tenantAdmin('disp-a'),
          fakeResponse(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('inventory CSV rejects cross-dispensary read', async () => {
      await expect(
        controller.inventoryCsv(
          'disp-b',
          tenantAdmin('disp-a'),
          fakeResponse(),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('inventory CSV allows the caller their own tenant', async () => {
      await controller.inventoryCsv(
        'disp-a',
        tenantAdmin('disp-a'),
        fakeResponse(),
      );
      expect(svc['generateInventoryCsv']).toHaveBeenCalledWith('disp-a');
    });
  });

  describe('PayrollController', () => {
    let controller: PayrollController;
    let svc: { generatePayrollCsv: jest.Mock };

    beforeEach(async () => {
      svc = { generatePayrollCsv: jest.fn(() => Promise.resolve('csv')) };
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          PayrollController,
          { provide: TimeClockService, useValue: svc },
        ],
      }).compile();
      controller = moduleRef.get(PayrollController);
    });

    it('rejects cross-dispensary export', async () => {
      await expect(
        controller.exportCsv(
          'disp-b',
          '2026-01-01',
          '2026-01-31',
          tenantAdmin('disp-a'),
          fakeResponse(),
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(svc.generatePayrollCsv).not.toHaveBeenCalled();
    });

    it('allows the caller their own export', async () => {
      await controller.exportCsv(
        'disp-a',
        '2026-01-01',
        '2026-01-31',
        tenantAdmin('disp-a'),
        fakeResponse(),
      );
      expect(svc.generatePayrollCsv).toHaveBeenCalled();
    });
  });

  describe('ImageController', () => {
    let controller: ImageController;
    let images: { uploadProductImage: jest.Mock; deleteFile: jest.Mock; uploadAvatar: jest.Mock };
    let dsQuery: jest.Mock;

    beforeEach(async () => {
      dsQuery = jest.fn();
      images = {
        uploadProductImage: jest.fn(() =>
          Promise.resolve({ url: 'u', thumbnailUrl: 't' }),
        ),
        deleteFile: jest.fn(),
        uploadAvatar: jest.fn(),
      };
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          ImageController,
          { provide: ImageService, useValue: images },
          { provide: getDataSourceToken(), useValue: { query: dsQuery } },
          {
            provide: DispensaryOwnershipService,
            useValue: { assertOwns: jest.fn().mockResolvedValue({ organizationId: null }) },
          },
        ],
      }).compile();
      controller = moduleRef.get(ImageController);
    });

    function req(user: JwtPayload): { user: JwtPayload } {
      return { user };
    }

    it('upload rejects when product belongs to a different tenant', async () => {
      dsQuery.mockResolvedValueOnce([{ dispensary_id: 'disp-b' }]);
      await expect(
        controller.uploadProductImage(
          { buffer: Buffer.from('') } as never,
          'prod-1',
          req(tenantAdmin('disp-a')) as never,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(images.uploadProductImage).not.toHaveBeenCalled();
    });

    it('upload throws NotFound when productId is unknown', async () => {
      dsQuery.mockResolvedValueOnce([]);
      await expect(
        controller.uploadProductImage(
          { buffer: Buffer.from('') } as never,
          'prod-x',
          req(tenantAdmin('disp-a')) as never,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('upload succeeds when product belongs to caller', async () => {
      dsQuery.mockResolvedValueOnce([{ dispensary_id: 'disp-a' }]);
      const result = await controller.uploadProductImage(
        { buffer: Buffer.from('') } as never,
        'prod-1',
        req(tenantAdmin('disp-a')) as never,
      );
      expect(result.success).toBe(true);
      expect(images.uploadProductImage).toHaveBeenCalledWith(
        expect.anything(),
        'disp-a',
        'prod-1',
      );
    });

    it('delete rejects cross-tenant', async () => {
      dsQuery.mockResolvedValueOnce([{ dispensary_id: 'disp-b' }]);
      await expect(
        controller.deleteProductImage(
          'prod-1',
          req(tenantAdmin('disp-a')) as never,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('super_admin can mutate any tenant', async () => {
      dsQuery
        .mockResolvedValueOnce([{ dispensary_id: 'disp-b' }])
        .mockResolvedValueOnce([{ image_url: 'u', thumbnail_url: 't' }])
        .mockResolvedValueOnce(undefined);
      await controller.deleteProductImage(
        'prod-1',
        req({
          sub: 'super',
          email: 's@x',
          role: 'super_admin',
        }) as never,
      );
      expect(images.deleteFile).toHaveBeenCalled();
    });
  });
});
