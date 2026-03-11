import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { MetrcService } from './metrc.service';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { CredentialValidationResult } from './dto/credential-validation-result.type';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Resolver(() => MetrcCredential)
export class MetrcResolver {
  constructor(private readonly metrc: MetrcService) {}

  // Get credential for own dispensary
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => MetrcCredential, { name: 'metrcCredential', nullable: true })
  async getCredential(
    @CurrentUser() user: JwtPayload,
    @Args('dispensaryId', { type: () => ID, nullable: true }) dispensaryId?: string,
  ): Promise<MetrcCredential | null> {
    const targetId = dispensaryId ?? user.dispensaryId;
    if (!targetId) throw new ForbiddenException('dispensaryId required');
    if (user.role === 'dispensary_admin' && targetId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.metrc.getCredential(targetId);
  }

  // super_admin only — list all credentials
  @Roles('super_admin')
  @Query(() => [MetrcCredential], { name: 'allMetrcCredentials' })
  listAll(): Promise<MetrcCredential[]> {
    return this.metrc.listCredentials();
  }

  // Store or update credential
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => MetrcCredential, { name: 'upsertMetrcCredential' })
  async upsertCredential(
    @Args('input') input: UpsertCredentialInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<MetrcCredential> {
    if (user.role === 'dispensary_admin' && input.dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.metrc.upsertCredential(input);
  }

  // Validate credential against Metrc API
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => CredentialValidationResult, { name: 'validateMetrcCredential' })
  async validateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CredentialValidationResult> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.metrc.validateCredential(dispensaryId);
  }

  // Deactivate credential
  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => Boolean, { name: 'deactivateMetrcCredential' })
  async deactivateCredential(
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId) {
      throw new ForbiddenException('Access denied');
    }
    return this.metrc.deactivateCredential(dispensaryId);
  }
}
