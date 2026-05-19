import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { InjectionToken } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { TimeClockResolver } from '../../src/modules/timeclock/timeclock.resolver';
import { TimeClockService } from '../../src/modules/timeclock/timeclock.service';
import { TimeEntry } from '../../src/modules/timeclock/entities/time-entry.entity';
import { StaffPosResolver } from '../../src/modules/orders/staff-pos.resolver';
import {
  DispensaryProductTypesResolver,
} from '../../src/modules/dispensaries/dispensary-product-types.resolver';
import { JwtPayload } from '../../src/modules/auth/strategies/jwt.strategy';

/**
 * Tenant-isolation runtime spec (sc-609).
 *
 * Demonstrates the pattern: a dispensary_admin of tenant A cannot
 * invoke resolvers that take a `dispensaryId` arg with tenant B's id.
 *
 * Covers the three endpoints that the static-analysis audit
 * (`apps/api/scripts/tenant-isolation-audit.ts`) flagged as
 * pre-sc-609 leaks and that this PR fixes:
 *   - `activeClocks` (timeclock.resolver.ts)
 *   - `saveDispensaryProductTypes` (dispensary-product-types.resolver.ts)
 *   - `searchCustomers` (orders/staff-pos.resolver.ts)
 *
 * Service / DataSource layers are mocked — we're testing the
 * resolver's `user.dispensaryId !== dispensaryId` enforcement, not
 * the underlying SQL. A future story can extend this rig with a
 * real test DB to catch service-layer leaks (the audit's 114
 * "delegated" entries).
 */

function tenantAdmin(dispensaryId: string): JwtPayload {
  return {
    sub: `user-${dispensaryId}`,
    email: `admin@${dispensaryId}.test`,
    role: 'dispensary_admin',
    dispensaryId,
  };
}

function superAdmin(): JwtPayload {
  return {
    sub: 'super-1',
    email: 'super@cannasaas.test',
    role: 'super_admin',
  };
}

describe('Tenant isolation — runtime contract (sc-609)', () => {
  describe('TimeClockResolver.activeClocks', () => {
    async function buildResolver(): Promise<TimeClockResolver> {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          TimeClockResolver,
          {
            provide: TimeClockService,
            useValue: {
              getActiveClocks: jest.fn(() => Promise.resolve([])),
            },
          },
          {
            provide: getRepositoryToken(TimeEntry),
            useValue: { find: jest.fn() },
          },
        ],
      }).compile();
      return moduleRef.get(TimeClockResolver);
    }

    it('dispensary_admin of A cannot query active clocks for B', async () => {
      const resolver = await buildResolver();
      await expect(
        resolver.activeClocks('disp-b', tenantAdmin('disp-a')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('dispensary_admin of A can query their own', async () => {
      const resolver = await buildResolver();
      await expect(
        resolver.activeClocks('disp-a', tenantAdmin('disp-a')),
      ).resolves.toBeDefined();
    });

    it('super_admin can query any dispensary', async () => {
      const resolver = await buildResolver();
      await expect(
        resolver.activeClocks('disp-b', superAdmin()),
      ).resolves.toBeDefined();
    });
  });

  describe('DispensaryProductTypesResolver.saveDispensaryProductTypes', () => {
    async function buildResolver(): Promise<DispensaryProductTypesResolver> {
      const dsMock = {
        createQueryRunner: () => ({
          connect: jest.fn(),
          startTransaction: jest.fn(),
          query: jest.fn(),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
        }),
        query: jest.fn(() => Promise.resolve([])),
      };
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          DispensaryProductTypesResolver,
          {
            provide: getDataSourceToken() as InjectionToken,
            useValue: dsMock,
          },
        ],
      }).compile();
      return moduleRef.get(DispensaryProductTypesResolver);
    }

    it('dispensary_admin of A cannot save types for B', async () => {
      const resolver = await buildResolver();
      await expect(
        resolver.saveDispensaryProductTypes(
          'disp-b',
          [],
          tenantAdmin('disp-a'),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('dispensary_admin of A can save their own', async () => {
      const resolver = await buildResolver();
      await expect(
        resolver.saveDispensaryProductTypes(
          'disp-a',
          [],
          tenantAdmin('disp-a'),
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('StaffPosResolver.searchCustomers', () => {
    async function buildResolver(): Promise<StaffPosResolver> {
      const dsMock = {
        query: jest.fn(() => Promise.resolve([])),
      } as unknown as DataSource;
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          StaffPosResolver,
          {
            provide: getDataSourceToken() as InjectionToken,
            useValue: dsMock,
          },
        ],
      }).compile();
      return moduleRef.get(StaffPosResolver);
    }

    it('budtender of A cannot search customers for B', async () => {
      const resolver = await buildResolver();
      await expect(
        resolver.searchCustomers(
          'disp-b',
          'alice',
          10,
          { ...tenantAdmin('disp-a'), role: 'budtender' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
