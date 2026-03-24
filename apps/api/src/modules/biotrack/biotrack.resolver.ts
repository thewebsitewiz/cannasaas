import { Resolver, Query, Mutation, Args, ID, ObjectType, Field, Int } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { BiotrackService } from './biotrack.service';
import { BiotrackCredential } from './entities/biotrack-credential.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class BiotrackValidationResult {
  @Field() valid!: boolean;
  @Field() message!: string;
}

@ObjectType()
class BiotrackSyncResult {
  @Field() success!: boolean;
  @Field() message!: string;
  @Field(() => Int, { nullable: true }) itemCount?: number;
}

@Resolver(() => BiotrackCredential)
export class BiotrackResolver {
  constructor(private readonly biotrack: BiotrackService) {}

  private guard(user: JwtPayload, dispensaryId: string) {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => BiotrackCredential, { name: 'biotrackCredential', nullable: true })
  async getCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BiotrackCredential | null> {
    this.guard(user, dispensaryId);
    return this.biotrack.getCredential(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => BiotrackCredential, { name: 'upsertBiotrackCredential' })
  async upsertCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('apiKey') apiKey: string,
    @Args('apiSecret', { nullable: true }) apiSecret: string,
    @Args('state') state: string,
    @Args('licenseNumber', { nullable: true }) licenseNumber: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BiotrackCredential> {
    this.guard(user, dispensaryId);
    return this.biotrack.upsertCredential({ dispensaryId, apiKey, apiSecret, state, licenseNumber });
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => BiotrackValidationResult, { name: 'validateBiotrackCredential' })
  async validateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BiotrackValidationResult> {
    this.guard(user, dispensaryId);
    return this.biotrack.validateCredential(dispensaryId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => BiotrackSyncResult, { name: 'syncBiotrackInventory' })
  async syncInventory(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BiotrackSyncResult> {
    this.guard(user, dispensaryId);
    return this.biotrack.syncInventory(dispensaryId);
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => BiotrackSyncResult, { name: 'reportSaleToBiotrack' })
  async reportSale(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<BiotrackSyncResult> {
    this.guard(user, dispensaryId);
    return this.biotrack.reportSale(dispensaryId, orderId);
  }

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => String, { name: 'complianceSystem' })
  async getComplianceSystem(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<string> {
    this.guard(user, dispensaryId);
    return this.biotrack.getComplianceSystem(dispensaryId);
  }
}
