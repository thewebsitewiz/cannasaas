import {
  Field,
  ObjectType,
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
} from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  MetrcService,
  BulkTagUidsResponse,
  FailedSyncDashboard as FailedSyncDashboardResult,
  SyncSaleResult,
} from './metrc.service';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CredentialValidationResult } from './dto/credential-validation-result.type';
import { ComplianceReport } from './dto/compliance-report.type';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { TagProductUidInput } from './dto/tag-product-uid.input';
import { BulkTagUidInput } from './dto/bulk-tag-uid.input';
import { BulkTagResult } from './dto/bulk-tag-result.type';
import { MetrcSaleResult } from './dto/metrc-sale-result.type';
import { FailedSyncDashboard } from './dto/failed-sync.type';
import { MetrcSyncQueueStats } from './dto/queue-stats.type';
import { MetrcLicenseValidatorService } from './metrc-license-validator.service';
import { MetrcSyncQueueService } from './queue/metrc-sync.queue-service';
import { TagPackageLabelInput } from './dto/tag-package-label.input';
import { SetMetrcCategoryInput } from './dto/set-metrc-category.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class MetrcLicenseValidationResult {
  @Field() valid!: boolean;
  @Field({ nullable: true }) reason?: string;
  @Field({ nullable: true }) licenseType?: string;
}

@Resolver(() => MetrcCredential)
export class MetrcResolver {
  constructor(
    private readonly metrc: MetrcService,
    private readonly syncQueue: MetrcSyncQueueService,
    private readonly licenseValidator: MetrcLicenseValidatorService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MetrcLicenseValidationResult, {
    name: 'validateMetrcLicense',
  })
  validateMetrcLicense(
    @Args('licenseNumber') licenseNumber: string,
    @Args('state') state: string,
  ): MetrcLicenseValidationResult {
    return this.licenseValidator.validate(licenseNumber, state);
  }

  // ── Credentials ──────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => MetrcCredential, { name: 'metrcCredential', nullable: true })
  async getCredential(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId?: string,
  ): Promise<MetrcCredential | null> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.metrc.getCredential(targetId);
  }

  @Roles('super_admin')
  @Query(() => [MetrcCredential], { name: 'allMetrcCredentials' })
  listAll(): Promise<MetrcCredential[]> {
    return this.metrc.listCredentials();
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MetrcCredential, { name: 'upsertMetrcCredential' })
  async upsertCredential(
    @Args('input') input: UpsertCredentialInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<MetrcCredential> {
    if (
      user.role === 'dispensary_admin' &&
      input.dispensaryId !== user.dispensaryId
    )
      throw new ForbiddenException('Access denied');
    return this.metrc.upsertCredential(input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => CredentialValidationResult, {
    name: 'validateMetrcCredential',
  })
  async validateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CredentialValidationResult> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.metrc.validateCredential(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deactivateMetrcCredential' })
  async deactivateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.metrc.deactivateCredential(dispensaryId);
  }

  // ── Compliance ───────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Product, { name: 'tagProductMetrcUid' })
  async tagProductUid(
    @Args('input') input: TagProductUidInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    if (
      user.role === 'dispensary_admin' &&
      input.dispensaryId !== user.dispensaryId
    )
      throw new ForbiddenException('Access denied');
    return this.metrc.tagProductUid(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ProductVariant, { name: 'tagVariantPackageLabel' })
  async tagPackageLabel(
    @Args('input') input: TagPackageLabelInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    if (
      user.role === 'dispensary_admin' &&
      input.dispensaryId !== user.dispensaryId
    )
      throw new ForbiddenException('Access denied');
    return this.metrc.tagPackageLabel(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Product, { name: 'setProductMetrcCategory' })
  async setMetrcCategory(
    @Args('input') input: SetMetrcCategoryInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    if (
      user.role === 'dispensary_admin' &&
      input.dispensaryId !== user.dispensaryId
    )
      throw new ForbiddenException('Access denied');
    return this.metrc.setMetrcCategory(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ComplianceReport, { name: 'metrcComplianceReport' })
  async complianceReport(
    @Args('dispensaryId', { type: () => ID, nullable: true })
    dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ComplianceReport> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.metrc.generateComplianceReport(targetId, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => BulkTagResult, { name: 'bulkTagProductUids' })
  async bulkTagUids(
    @Args('input') input: BulkTagUidInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<BulkTagUidsResponse> {
    if (
      user.role === 'dispensary_admin' &&
      input.dispensaryId !== user.dispensaryId
    )
      throw new ForbiddenException('Access denied');
    return this.metrc.bulkTagUids(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'approveProduct' })
  async approveProduct(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.metrc.approveProduct(
      productId,
      dispensaryId,
      user.sub,
      this.dataSource,
    );
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MetrcSaleResult, { name: 'syncOrderToMetrc' })
  async syncSaleToMetrc(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SyncSaleResult> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.metrc.syncSaleToMetrc(orderId, dispensaryId, this.dataSource);
  }

  // ── Queue Management ─────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Int, { name: 'retryFailedMetrcSyncs' })
  async retryFailed(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<number> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.syncQueue.enqueueRetryFailed(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'retryMetrcSync' })
  async retrySingle(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.syncQueue.enqueueRetrySingleSync(orderId, dispensaryId);
  }

  // ── Failed Sync Dashboard ────────────────────────────────────────────────

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => FailedSyncDashboard, { name: 'failedMetrcSyncs' })
  async failedMetrcSyncs(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<FailedSyncDashboardResult> {
    if (
      user.role === 'dispensary_admin' &&
      dispensaryId !== user.dispensaryId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return this.metrc.getFailedSyncDashboard(dispensaryId, this.dataSource);
  }

  // ── Queue Stats ──────────────────────────────────────────────────────────

  /**
   * Live BullMQ counts for the `metrc-sync` queue. Operators use this
   * to answer "is the queue moving?" — pair with `failedMetrcSyncs` to
   * see which specific orders are stuck.
   *
   * super_admin-only because the queue is global (single queue across
   * all tenants today). If we ever shard the queue per-dispensary,
   * extend the access to dispensary_admin scoped to their own slice.
   */
  @Roles('super_admin')
  @Query(() => MetrcSyncQueueStats, { name: 'metrcSyncQueueStats' })
  async queueStats(): Promise<MetrcSyncQueueStats> {
    const stats = await this.syncQueue.getQueueStats();
    return {
      waiting: stats.waiting ?? 0,
      active: stats.active ?? 0,
      failed: stats.failed ?? 0,
      completed: stats.completed ?? 0,
      delayed: stats.delayed ?? 0,
    };
  }
}
