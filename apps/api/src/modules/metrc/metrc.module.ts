import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { MetrcSyncLog } from './entities/metrc-sync-log.entity';
import { ComplianceLog } from './entities/compliance-log.entity';
import { RegulatoryLibrary } from './entities/regulatory-library.entity';
import { MetrcService } from './metrc.service';
import { MetrcApiClient } from './metrc-api.client';
import { MetrcResolver } from './metrc.resolver';
import { MetrcSyncProcessor } from './queue/metrc-sync.processor';
import { MetrcSyncQueueService } from './queue/metrc-sync.queue-service';
import { METRC_SYNC_QUEUE } from './queue/metrc-sync.queue';
import { OrderCompletedListener } from './listeners/order-completed.listener';
import { MetrcInventorySyncCron } from './cron/metrc-inventory-sync.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetrcCredential, MetrcSyncLog, ComplianceLog, RegulatoryLibrary]),
    BullModule.registerQueue({ name: METRC_SYNC_QUEUE }),
  ],
  providers: [
    MetrcService,
    MetrcApiClient,
    MetrcResolver,
    MetrcSyncProcessor,
    MetrcSyncQueueService,
    OrderCompletedListener,
    MetrcInventorySyncCron,
  ],
  exports: [MetrcService, MetrcApiClient, MetrcSyncQueueService],
})
export class MetrcModule {}
