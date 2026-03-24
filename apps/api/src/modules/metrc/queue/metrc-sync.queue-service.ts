import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { METRC_SYNC_QUEUE, MetrcJobName } from './metrc-sync.queue';
import { SyncSaleJobData } from './metrc-sync.processor';

@Injectable()
export class MetrcSyncQueueService {
  private readonly logger = new Logger(MetrcSyncQueueService.name);

  constructor(
    @InjectQueue(METRC_SYNC_QUEUE) private readonly queue: Queue,
    @InjectDataSource() private dataSource: DataSource,
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
    const failed = await this.dataSource.query(
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
}
