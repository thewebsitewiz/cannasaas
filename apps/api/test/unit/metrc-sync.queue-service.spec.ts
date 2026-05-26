/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types. Matches the
// convention of every other spec in test/unit/.

import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';

import {
  METRC_SYNC_QUEUE,
  MetrcJobName,
} from '../../src/modules/metrc/queue/metrc-sync.queue';
import { MetrcSyncQueueService } from '../../src/modules/metrc/queue/metrc-sync.queue-service';

describe('MetrcSyncQueueService.enqueueRetrySingleSync (sc-684)', () => {
  let service: MetrcSyncQueueService;
  let queueAdd: jest.Mock;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    queueAdd = jest.fn();
    dsQuery = jest.fn();
    const mockQueue = { add: queueAdd, getWaitingCount: jest.fn() };
    const mockDataSource: Partial<DataSource> = { query: dsQuery };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetrcSyncQueueService,
        { provide: getQueueToken(METRC_SYNC_QUEUE), useValue: mockQueue },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get(MetrcSyncQueueService);
  });

  it('returns false + does NOT enqueue when no failed row matches', async () => {
    dsQuery.mockResolvedValueOnce([]);
    const result = await service.enqueueRetrySingleSync('order-1', 'd-1');
    expect(result).toBe(false);
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it('queries with the failed-status + dispensary guard', async () => {
    dsQuery.mockResolvedValueOnce([{ orderId: 'order-1' }]);
    await service.enqueueRetrySingleSync('order-1', 'd-1');
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/SELECT "orderId" FROM orders/);
    expect(sql).toMatch(/"metrcSyncStatus" = 'failed'/);
    expect(sql).toMatch(/"orderId" = \$1/);
    expect(sql).toMatch(/"dispensaryId" = \$2/);
    expect(params).toEqual(['order-1', 'd-1']);
  });

  it('enqueues a RETRY_FAILED job with the right payload + backoff', async () => {
    dsQuery.mockResolvedValueOnce([{ orderId: 'order-1' }]);
    const result = await service.enqueueRetrySingleSync('order-1', 'd-1');
    expect(result).toBe(true);
    expect(queueAdd).toHaveBeenCalledTimes(1);
    const [jobName, payload, opts] = queueAdd.mock.calls[0] as [
      string,
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(jobName).toBe(MetrcJobName.RETRY_FAILED);
    expect(payload).toEqual({
      orderId: 'order-1',
      dispensaryId: 'd-1',
      attemptNumber: 1,
    });
    expect(opts.attempts).toBe(3);
  });
});
