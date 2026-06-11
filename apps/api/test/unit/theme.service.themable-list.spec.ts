/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ThemeService } from '../../src/modules/theme/theme.service';
import { ThemeConfig } from '../../src/modules/theme/theme-config.entity';
import { CacheService } from '../../src/common/services/cache.service';

/**
 * Sc-637 follow-on: `myThemableDispensaries` returns the dispensaries
 * the admin is scoped to. SQL shape is asserted (snake_case columns,
 * camelCase aliases) so a future schema refactor breaks the test
 * before it breaks production.
 */
describe('ThemeService.listThemableForUser (sc-637 follow-on)', () => {
  let service: ThemeService;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    dsQuery = jest.fn().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeService,
        {
          provide: getRepositoryToken(ThemeConfig),
          useValue: {},
        },
        { provide: CacheService, useValue: {} },
        { provide: DataSource, useValue: { query: dsQuery } },
      ],
    }).compile();
    service = module.get(ThemeService);
  });

  it('super_admin gets every active dispensary, no params bound', async () => {
    await service.listThemableForUser('super_admin', null, null);
    expect(dsQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = dsQuery.mock.calls[0];
    expect(sql).toContain('WHERE d.is_active = TRUE');
    expect(sql).not.toContain('organization_id');
    expect(params).toBeUndefined();
  });

  it('org_admin scopes by their organization', async () => {
    await service.listThemableForUser('org_admin', null, 'org-1');
    expect(dsQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = dsQuery.mock.calls[0];
    expect(sql).toContain('JOIN companies c');
    expect(sql).toContain('c.organization_id = $1');
    expect(params).toEqual(['org-1']);
  });

  it('org_admin with no organizationId returns an empty list without hitting the DB', async () => {
    const result = await service.listThemableForUser('org_admin', null, null);
    expect(result).toEqual([]);
    expect(dsQuery).not.toHaveBeenCalled();
  });

  it('dispensary_admin scopes to their single dispensary', async () => {
    await service.listThemableForUser('dispensary_admin', 'disp-1', null);
    expect(dsQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = dsQuery.mock.calls[0];
    expect(sql).toContain('WHERE d.entity_id = $1');
    expect(params).toEqual(['disp-1']);
  });

  it('other roles return empty without hitting the DB', async () => {
    const result = await service.listThemableForUser('budtender', null, null);
    expect(result).toEqual([]);
    expect(dsQuery).not.toHaveBeenCalled();
  });
});
