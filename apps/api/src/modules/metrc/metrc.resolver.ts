import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MetrcService } from './metrc.service';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CredentialValidationResult } from './dto/credential-validation-result.type';
import { ComplianceReport } from './dto/compliance-report.type';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { TagProductUidInput } from './dto/tag-product-uid.input';
import { TagPackageLabelInput } from './dto/tag-package-label.input';
import { SetMetrcCategoryInput } from './dto/set-metrc-category.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver(() => MetrcCredential)
export class MetrcResolver {
  constructor(
    private readonly metrc: MetrcService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ── Credentials ──────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => MetrcCredential, { name: 'metrcCredential', nullable: true })
  async getCredential(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<MetrcCredential | null> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
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
    if (user.role === 'dispensary_admin' && input.dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.upsertCredential(input);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => CredentialValidationResult, { name: 'validateMetrcCredential' })
  async validateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CredentialValidationResult> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.validateCredential(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deactivateMetrcCredential' })
  async deactivateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.deactivateCredential(dispensaryId);
  }

  // ── Compliance ───────────────────────────────────────────────────────────

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Product, { name: 'tagProductMetrcUid' })
  async tagProductUid(
    @Args('input') input: TagProductUidInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    if (user.role === 'dispensary_admin' && input.dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.tagProductUid(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => ProductVariant, { name: 'tagVariantPackageLabel' })
  async tagPackageLabel(
    @Args('input') input: TagPackageLabelInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    if (user.role === 'dispensary_admin' && input.dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.tagPackageLabel(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Product, { name: 'setProductMetrcCategory' })
  async setMetrcCategory(
    @Args('input') input: SetMetrcCategoryInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<any> {
    if (user.role === 'dispensary_admin' && input.dispensaryId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.setMetrcCategory(input, this.dataSource);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => ComplianceReport, { name: 'metrcComplianceReport' })
  async complianceReport(
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ComplianceReport> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) throw new ForbiddenException('Access denied');
    return this.metrc.generateComplianceReport(targetId, this.dataSource);
  }
}
