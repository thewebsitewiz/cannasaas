import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { MetrcSyncLog } from './entities/metrc-sync-log.entity';
import { ComplianceLog } from './entities/compliance-log.entity';
import { RegulatoryLibrary } from './entities/regulatory-library.entity';
import { MetrcService } from './metrc.service';
import { MetrcResolver } from './metrc.resolver';
import { MetrcSyncProcessor } from './queue/metrc-sync.processor';
import { MetrcSyncQueueService } from './queue/metrc-sync.queue-service';
import { METRC_SYNC_QUEUE } from './queue/metrc-sync.queue';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetrcCredential, MetrcSyncLog, ComplianceLog, RegulatoryLibrary]),
    BullModule.registerQueue({ name: METRC_SYNC_QUEUE }),
  ],
  providers: [MetrcService, MetrcResolver, MetrcSyncProcessor, MetrcSyncQueueService],
  exports: [MetrcService, MetrcSyncQueueService],
})
export class MetrcModule {}
