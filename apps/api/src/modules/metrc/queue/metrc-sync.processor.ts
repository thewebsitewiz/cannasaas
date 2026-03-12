import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MetrcService } from '../metrc.service';
import { METRC_SYNC_QUEUE, MetrcJobName } from './metrc-sync.queue';

export interface SyncSaleJobData {
  orderId: string;
  dispensaryId: string;
  attemptNumber: number;
}

@Processor(METRC_SYNC_QUEUE)
export class MetrcSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MetrcSyncProcessor.name);

  constructor(
    private readonly metrc: MetrcService,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<SyncSaleJobData>): Promise<any> {
    const { orderId, dispensaryId, attemptNumber } = job.data;

    this.logger.log(`Processing Metrc sync job: order=${orderId} attempt=${attemptNumber}`);

    if (job.name === MetrcJobName.SYNC_SALE || job.name === MetrcJobName.RETRY_FAILED) {
      const result = await this.metrc.syncSaleToMetrc(orderId, dispensaryId, this.dataSource);

      if (!result.success) {
        this.logger.warn(`Metrc sync failed for order ${orderId}: ${result.message}`);
        throw new Error(result.message ?? 'Metrc sync failed');
      }

      this.logger.log(`Metrc sync succeeded for order ${orderId}`);
      return result;
    }
  }
}
