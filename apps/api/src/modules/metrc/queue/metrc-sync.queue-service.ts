import { Inject, Injectable, Logger } from '@nestjs/common';
import { Inject, InjectQueue } from '@nestjs/bullmq';
import { Inject, Queue } from 'bullmq';
import { Inject, METRC_SYNC_QUEUE, MetrcJobName } from './metrc-sync.queue';
import { Inject, SyncSaleJobData } from './metrc-sync.processor';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class MetrcSyncQueueService {
  private readonly logger = new Logger(MetrcSyncQueueService.name);

  constructor(
    @InjectQueue(METRC_SYNC_QUEUE) private readonly queue: Queue,
    @Inject(DRIZZLE) private db: any
  ) {}

  async enqueueSaleSync(orderId: string, dispensaryId: string): Promise<void> {
    const jobData: SyncSaleJobData = { orderId, dispensaryId, attemptNumber: 1 };

    await this.queue.add(MetrcJobName.SYNC_SALE, jobData, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 60_000, // 1 min, 2 min, 4 min, 8 min, 16 min
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    });

    this.logger.log(`Enqueued Metrc sync for order ${orderId}`);
  }

  async enqueueRetryFailed(dispensaryId: string): Promise<number> {
    // Find all failed syncs for this dispensary
    const failed = await this._q(
      `SELECT "orderId" FROM orders
       WHERE "dispensaryId" = $1
       AND "metrcSyncStatus" = 'failed'
       AND "orderStatus" = 'completed'
       ORDER BY "createdAt" ASC`,
      [dispensaryId]
    );

    for (const order of failed) {
      await this.queue.add(
        MetrcJobName.RETRY_FAILED,
        { orderId: order.orderId, dispensaryId, attemptNumber: 1 } as SyncSaleJobData,
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 200 },
        }
      );
    }

    this.logger.log(`Enqueued ${failed.length} retry jobs for dispensary ${dispensaryId}`);
    return failed.length;
  }

  async getQueueStats(): Promise<Record<string, number>> {
    const [waiting, active, failed, completed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getFailedCount(),
      this.queue.getCompletedCount(),
      this.queue.getDelayedCount(),
    ]);
    return { waiting, active, failed, completed, delayed };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
