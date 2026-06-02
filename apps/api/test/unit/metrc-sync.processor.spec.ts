/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { MetrcSyncProcessor } from '../../src/modules/metrc/queue/metrc-sync.processor';
import { MetrcJobName } from '../../src/modules/metrc/queue/metrc-sync.queue';
import { MetrcService } from '../../src/modules/metrc/metrc.service';

interface FakeJob {
  name: string;
  data: { orderId: string; dispensaryId: string; attemptNumber: number };
}

describe('MetrcSyncProcessor.process (sc-592 TC-METRC-001, sc-594 TC-METRC-003)', () => {
  let processor: MetrcSyncProcessor;
  let syncSaleToMetrc: jest.Mock;

  beforeEach(async () => {
    syncSaleToMetrc = jest.fn();
    const dataSource = {} as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetrcSyncProcessor,
        { provide: MetrcService, useValue: { syncSaleToMetrc } },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    processor = module.get(MetrcSyncProcessor);
  });

  // ── TC-METRC-001 — Sync succeeds first try ───────────────────────────────

  it('TC-METRC-001 — SYNC_SALE: delegates to MetrcService and returns its successful result', async () => {
    const success = {
      success: true,
      message: 'OK',
      metrcReceiptNumber: 'rcpt-123',
      productsReported: 2,
    };
    syncSaleToMetrc.mockResolvedValueOnce(success);

    const job: FakeJob = {
      name: MetrcJobName.SYNC_SALE,
      data: { orderId: 'order-1', dispensaryId: 'd-1', attemptNumber: 1 },
    };
    const result = await processor.process(job as never);
    expect(result).toEqual(success);
    expect(syncSaleToMetrc).toHaveBeenCalledWith(
      'order-1',
      'd-1',
      expect.anything(),
    );
  });

  it('TC-METRC-001 — RETRY_FAILED routes through the same MetrcService call', async () => {
    const success = {
      success: true,
      message: 'OK',
      metrcReceiptNumber: 'rcpt-456',
    };
    syncSaleToMetrc.mockResolvedValueOnce(success);

    const job: FakeJob = {
      name: MetrcJobName.RETRY_FAILED,
      data: { orderId: 'order-2', dispensaryId: 'd-2', attemptNumber: 3 },
    };
    const result = await processor.process(job as never);
    expect(result).toEqual(success);
    expect(syncSaleToMetrc).toHaveBeenCalledWith(
      'order-2',
      'd-2',
      expect.anything(),
    );
  });

  // ── TC-METRC-003 — Exhausted attempts mark failed ────────────────────────
  // Each failed attempt throws, which BullMQ uses to schedule a retry per the
  // queue's `attempts: 5, backoff: exponential` config. After the 5th throw,
  // BullMQ stops retrying and the job ends up in 'failed'. The order itself
  // is marked `metrcSyncStatus = 'failed'` inside MetrcService.syncSaleToMetrc
  // on every failed attempt — so when retries run out, the order row is
  // already in the failed state.

  it('TC-METRC-003 — process throws when MetrcService reports !success (this triggers BullMQ retry / exhaustion)', async () => {
    syncSaleToMetrc.mockResolvedValueOnce({
      success: false,
      message: 'Metrc 502 Bad Gateway',
    });

    const job: FakeJob = {
      name: MetrcJobName.SYNC_SALE,
      data: { orderId: 'order-x', dispensaryId: 'd-1', attemptNumber: 5 },
    };

    await expect(processor.process(job as never)).rejects.toThrow(
      /Metrc 502 Bad Gateway/,
    );
  });

  it('TC-METRC-003 — process re-throws underlying network errors so BullMQ counts them as failed attempts', async () => {
    syncSaleToMetrc.mockRejectedValueOnce(new Error('ECONNRESET'));

    const job: FakeJob = {
      name: MetrcJobName.SYNC_SALE,
      data: { orderId: 'order-y', dispensaryId: 'd-1', attemptNumber: 1 },
    };

    await expect(processor.process(job as never)).rejects.toThrow(/ECONNRESET/);
  });

  it('TC-METRC-003 — falls back to a generic "Metrc sync failed" message when MetrcService returns no message', async () => {
    syncSaleToMetrc.mockResolvedValueOnce({ success: false });
    const job: FakeJob = {
      name: MetrcJobName.SYNC_SALE,
      data: { orderId: 'order-z', dispensaryId: 'd-1', attemptNumber: 1 },
    };
    await expect(processor.process(job as never)).rejects.toThrow(
      /Metrc sync failed/,
    );
  });

  it('unknown job names are silently no-op (defensive — keeps the worker alive)', async () => {
    const job: FakeJob = {
      name: 'totally-not-a-metrc-job',
      data: { orderId: 'x', dispensaryId: 'd-1', attemptNumber: 1 },
    };
    const result = await processor.process(job as never);
    expect(result).toBeUndefined();
    expect(syncSaleToMetrc).not.toHaveBeenCalled();
  });
});
