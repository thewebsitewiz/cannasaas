import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { MetrcSyncLog } from './entities/metrc-sync-log.entity';
import { ComplianceLog } from './entities/compliance-log.entity';
import { RegulatoryLibrary } from './entities/regulatory-library.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetrcCredential, MetrcSyncLog, ComplianceLog, RegulatoryLibrary])],
  exports: [TypeOrmModule],
})
export class MetrcModule {}
