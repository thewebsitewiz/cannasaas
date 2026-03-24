import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetrcManifest, MetrcManifestItem, WasteDestructionLog, AuditLog, ReconciliationReport, ReconciliationItem } from './entities/compliance.entity';
import { ComplianceService } from './compliance.service';
import { ComplianceResolver } from './compliance.resolver';
import { ComplianceAlertsService } from './compliance-alerts.service';

@Module({
  imports: [TypeOrmModule.forFeature([MetrcManifest, MetrcManifestItem, WasteDestructionLog, AuditLog, ReconciliationReport, ReconciliationItem])],
  providers: [ComplianceService, ComplianceResolver, ComplianceAlertsService],
  exports: [ComplianceService, ComplianceAlertsService],
})
export class ComplianceModule {}
