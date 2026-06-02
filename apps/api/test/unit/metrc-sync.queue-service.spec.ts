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

// ── TC-METRC-001 + TC-METRC-002 — initial sync enqueue + backoff ─────────────

describe('MetrcSyncQueueService.enqueueSaleSync', () => {
  let service: MetrcSyncQueueService;
  let queueAdd: jest.Mock;

  beforeEach(async () => {
    queueAdd = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetrcSyncQueueService,
        {
          provide: getQueueToken(METRC_SYNC_QUEUE),
          useValue: { add: queueAdd, getWaitingCount: jest.fn() },
        },
        { provide: DataSource, useValue: { query: jest.fn() } },
      ],
    }).compile();
    service = module.get(MetrcSyncQueueService);
  });

  it('TC-METRC-001 — enqueueSaleSync adds a SYNC_SALE job with attempt #1', async () => {
    await service.enqueueSaleSync('order-1', 'd-1');
    expect(queueAdd).toHaveBeenCalledTimes(1);
    const [jobName, payload] = queueAdd.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(jobName).toBe(MetrcJobName.SYNC_SALE);
    expect(payload).toEqual({
      orderId: 'order-1',
      dispensaryId: 'd-1',
      attemptNumber: 1,
    });
  });

  it('TC-METRC-002 — initial sync uses exponential backoff with 5 attempts and 60s base delay', async () => {
    await service.enqueueSaleSync('order-1', 'd-1');
    const [, , opts] = queueAdd.mock.calls[0] as [
      string,
      Record<string, unknown>,
      { attempts: number; backoff: { type: string; delay: number } },
    ];
    expect(opts.attempts).toBe(5);
    expect(opts.backoff.type).toBe('exponential');
    expect(opts.backoff.delay).toBe(60_000);
  });
});

// ── TC-METRC-004 — bulk-enqueue picks up failed orders ────────────────────────

describe('MetrcSyncQueueService.enqueueRetryFailed (sc-595 TC-METRC-004)', () => {
  let service: MetrcSyncQueueService;
  let queueAdd: jest.Mock;
  let dsQuery: jest.Mock;

  beforeEach(async () => {
    queueAdd = jest.fn();
    dsQuery = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetrcSyncQueueService,
        {
          provide: getQueueToken(METRC_SYNC_QUEUE),
          useValue: { add: queueAdd, getWaitingCount: jest.fn() },
        },
        { provide: DataSource, useValue: { query: dsQuery } },
      ],
    }).compile();
    service = module.get(MetrcSyncQueueService);
  });

  it('selects only failed + completed orders for the dispensary, oldest first', async () => {
    dsQuery.mockResolvedValueOnce([]);
    await service.enqueueRetryFailed('d-1');
    const [sql, params] = dsQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/"dispensaryId" = \$1/);
    expect(sql).toMatch(/"metrcSyncStatus" = 'failed'/);
    expect(sql).toMatch(/"orderStatus" = 'completed'/);
    expect(sql).toMatch(/ORDER BY "createdAt" ASC/);
    expect(params).toEqual(['d-1']);
  });

  it('returns 0 + does not enqueue when there are no failed orders', async () => {
    dsQuery.mockResolvedValueOnce([]);
    const count = await service.enqueueRetryFailed('d-1');
    expect(count).toBe(0);
    expect(queueAdd).not.toHaveBeenCalled();
  });

  it('enqueues one RETRY_FAILED job per failed row and returns the count', async () => {
    dsQuery.mockResolvedValueOnce([
      { orderId: 'order-a' },
      { orderId: 'order-b' },
      { orderId: 'order-c' },
    ]);
    const count = await service.enqueueRetryFailed('d-1');
    expect(count).toBe(3);
    expect(queueAdd).toHaveBeenCalledTimes(3);
    for (const call of queueAdd.mock.calls) {
      const [jobName, , opts] = call as [
        string,
        Record<string, unknown>,
        { attempts: number; backoff: { type: string; delay: number } },
      ];
      expect(jobName).toBe(MetrcJobName.RETRY_FAILED);
      expect(opts.attempts).toBe(3);
      expect(opts.backoff.type).toBe('exponential');
      expect(opts.backoff.delay).toBe(30_000);
    }
    // First job's payload is order-a
    const firstPayload = queueAdd.mock.calls[0][1] as Record<string, unknown>;
    expect(firstPayload.orderId).toBe('order-a');
    expect(firstPayload.dispensaryId).toBe('d-1');
    expect(firstPayload.attemptNumber).toBe(1);
  });
});
