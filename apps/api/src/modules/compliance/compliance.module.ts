import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetrcManifest, MetrcManifestItem, WasteDestructionLog, AuditLog, ReconciliationReport, ReconciliationItem } from './entities/compliance.entity';
import { ComplianceService } from './compliance.service';
import { ComplianceResolver } from './compliance.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([MetrcManifest, MetrcManifestItem, WasteDestructionLog, AuditLog, ReconciliationReport, ReconciliationItem])],
  providers: [ComplianceService, ComplianceResolver],
  exports: [ComplianceService],
})
export class ComplianceModule {}
