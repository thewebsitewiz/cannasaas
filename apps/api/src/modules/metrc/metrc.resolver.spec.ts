import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { MetrcResolver } from './metrc.resolver';
import { MetrcService } from './metrc.service';
import { MetrcSyncQueueService } from './queue/metrc-sync.queue-service';

/**
 * Smoke spec for the sc-608 queue-stats query. The other Metrc
 * resolver methods have integration coverage via the cross-tenant
 * spec (sc-609); this spec adds focused coverage for the new
 * `metrcSyncQueueStats` resolver only.
 */
describe('MetrcResolver — queueStats (sc-608)', () => {
  let resolver: MetrcResolver;
  let getQueueStats: jest.Mock;

  beforeEach(async () => {
    getQueueStats = jest.fn();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MetrcResolver,
        {
          provide: MetrcService,
          useValue: {} as MetrcService,
        },
        {
          provide: MetrcSyncQueueService,
          useValue: {
            getQueueStats,
          } as unknown as MetrcSyncQueueService,
        },
        {
          provide: getDataSourceToken(),
          useValue: {} as DataSource,
        },
      ],
    }).compile();
    resolver = moduleRef.get(MetrcResolver);
  });

  it('returns the live BullMQ counts', async () => {
    getQueueStats.mockResolvedValue({
      waiting: 3,
      active: 1,
      failed: 7,
      completed: 100,
      delayed: 2,
    });
    await expect(resolver.queueStats()).resolves.toEqual({
      waiting: 3,
      active: 1,
      failed: 7,
      completed: 100,
      delayed: 2,
    });
  });

  it('zero-fills missing keys (defensive)', async () => {
    getQueueStats.mockResolvedValue({});
    await expect(resolver.queueStats()).resolves.toEqual({
      waiting: 0,
      active: 0,
      failed: 0,
      completed: 0,
      delayed: 0,
    });
  });
});
