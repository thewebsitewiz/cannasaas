/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { DispensaryOwnershipService } from '../../src/common/services/dispensary-ownership.service';

describe('DispensaryOwnershipService (sc-637 follow-on)', () => {
  let service: DispensaryOwnershipService;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    dsQuery = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispensaryOwnershipService,
        { provide: DataSource, useValue: { query: dsQuery } },
      ],
    }).compile();
    service = module.get(DispensaryOwnershipService);
  });

  it('rejects an unauthenticated caller', async () => {
    await expect(service.assertOwns(undefined, 'disp-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows super_admin against any dispensary without hitting the DB', async () => {
    const result = await service.assertOwns(
      { sub: 'u-1', role: 'super_admin' },
      'disp-1',
    );
    expect(result.organizationId).toBeNull();
    expect(dsQuery).not.toHaveBeenCalled();
  });

  it('allows dispensary_admin only on their own dispensary', async () => {
    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'dispensary_admin', dispensaryId: 'disp-1' },
        'disp-1',
      ),
    ).resolves.toEqual({ organizationId: null });

    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'dispensary_admin', dispensaryId: 'disp-1' },
        'disp-2',
      ),
    ).rejects.toThrow(/cannot act on another dispensary/);

    expect(dsQuery).not.toHaveBeenCalled();
  });

  it('allows org_admin on a dispensary whose company belongs to their org', async () => {
    dsQuery.mockResolvedValueOnce([
      { entity_id: 'disp-1', organization_id: 'org-1' },
    ]);
    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'org_admin', organizationId: 'org-1' },
        'disp-1',
      ),
    ).resolves.toEqual({ organizationId: 'org-1' });
  });

  it('blocks org_admin when the dispensary belongs to a different org', async () => {
    dsQuery.mockResolvedValueOnce([
      { entity_id: 'disp-1', organization_id: 'org-2' },
    ]);
    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'org_admin', organizationId: 'org-1' },
        'disp-1',
      ),
    ).rejects.toThrow(/outside their organization/);
  });

  it('blocks org_admin when no organizationId claim is on the JWT', async () => {
    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'org_admin' },
        'disp-1',
      ),
    ).rejects.toThrow(/missing organizationId/);
    expect(dsQuery).not.toHaveBeenCalled();
  });

  it('blocks org_admin when the dispensary does not exist', async () => {
    dsQuery.mockResolvedValueOnce([]);
    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'org_admin', organizationId: 'org-1' },
        'disp-x',
      ),
    ).rejects.toThrow(/not found/);
  });

  it('blocks any other role outright', async () => {
    await expect(
      service.assertOwns(
        { sub: 'u-1', role: 'budtender', dispensaryId: 'disp-1' },
        'disp-1',
      ),
    ).rejects.toThrow(/cannot act on dispensary themes/);
  });
});
