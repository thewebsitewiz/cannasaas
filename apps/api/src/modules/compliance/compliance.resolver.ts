import { Resolver, Query, Mutation, Args, ID, Int, Float } from '@nestjs/graphql';
import { ObjectType, Field } from '@nestjs/graphql';
import { ComplianceService } from './compliance.service';
import { MetrcManifest, MetrcManifestItem, WasteDestructionLog, AuditLog, ReconciliationReport, ReconciliationItem } from './entities/compliance.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType() class EncryptionResult {
  @Field(() => Int) credentialsEncrypted!: number;
}

@Resolver()
export class ComplianceResolver {
  constructor(private readonly compliance: ComplianceService) {}

  // ── Manifests ─────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MetrcManifest, { name: 'generateManifest' })
  async generateManifest(
    @Args('transferId', { type: () => ID }) transferId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.compliance.generateManifest(transferId, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [MetrcManifest], { name: 'manifests' })
  async manifests(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('status', { nullable: true }) status: string,
  ): Promise<any[]> {
    return this.compliance.getManifests(dispensaryId, status);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [MetrcManifestItem], { name: 'manifestItems' })
  async manifestItems(@Args('manifestId', { type: () => ID }) manifestId: string): Promise<any[]> {
    return this.compliance.getManifestItems(manifestId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MetrcManifest, { name: 'updateManifestStatus' })
  async updateManifestStatus(
    @Args('manifestId', { type: () => ID }) manifestId: string,
    @Args('status') status: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.compliance.updateManifestStatus(manifestId, status, user.sub);
  }

  // ── Waste/Destruction ─────────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => WasteDestructionLog, { name: 'logWaste' })
  async logWaste(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('productName') productName: string,
    @Args('quantity', { type: () => Float }) quantity: number,
    @Args('unitOfMeasure', { defaultValue: 'grams' }) unitOfMeasure: string,
    @Args('wasteType') wasteType: string,
    @Args('reason') reason: string,
    @Args('witness1Name') witness1Name: string,
    @Args('witness1Title', { nullable: true }) witness1Title: string,
    @Args('witness2Name', { nullable: true }) witness2Name: string,
    @Args('destructionMethod', { nullable: true }) destructionMethod: string,
    @Args('variantId', { type: () => ID, nullable: true }) variantId: string,
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.compliance.logWaste({
      dispensaryId, productName, variantId, quantity, unitOfMeasure,
      wasteType, destructionMethod, reason,
      witness1Name, witness1Title, witness2Name,
      submittedByUserId: user.sub, notes,
    });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => WasteDestructionLog, { name: 'approveWaste' })
  async approveWaste(
    @Args('logId', { type: () => ID }) logId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.compliance.approveWaste(logId, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [WasteDestructionLog], { name: 'wasteLogs' })
  async wasteLogs(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
  ): Promise<any[]> {
    return this.compliance.getWasteLogs(dispensaryId, limit);
  }

  // ── Audit Log ─────────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [AuditLog], { name: 'auditLog' })
  async auditLog(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 100 }) limit: number,
    @Args('entityType', { nullable: true }) entityType: string,
    @Args('action', { nullable: true }) action: string,
  ): Promise<any[]> {
    return this.compliance.getAuditLog(dispensaryId, limit, entityType, action);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [AuditLog], { name: 'entityAuditTrail' })
  async entityAudit(
    @Args('entityType') entityType: string,
    @Args('entityId') entityId: string,
  ): Promise<any[]> {
    return this.compliance.getEntityAuditTrail(entityType, entityId);
  }

  // ── Reconciliation ────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ReconciliationReport, { name: 'runReconciliation' })
  async runRecon(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    return this.compliance.runReconciliation(dispensaryId, user.sub);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ReconciliationReport], { name: 'reconciliationReports' })
  async reconReports(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<any[]> {
    return this.compliance.getReconciliationReports(dispensaryId, limit);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [ReconciliationItem], { name: 'reconciliationItems' })
  async reconItems(
    @Args('reportId', { type: () => ID }) reportId: string,
    @Args('status', { nullable: true }) status: string,
  ): Promise<any[]> {
    return this.compliance.getReconciliationItems(reportId, status);
  }

  // ── Encryption ────────────────────────────────────────────────────────────

  @Roles('super_admin', 'org_admin')
  @Mutation(() => EncryptionResult, { name: 'encryptAllCredentials' })
  async encryptAll(): Promise<{ credentialsEncrypted: number }> {
    const count = await this.compliance.encryptAllCredentials();
    return { credentialsEncrypted: count };
  }
}
