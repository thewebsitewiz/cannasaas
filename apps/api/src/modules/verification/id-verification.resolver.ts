import { Resolver, Query, Mutation, Args, ID, Int, ObjectType, Field } from '@nestjs/graphql';
import { ForbiddenException } from '@nestjs/common';
import { IdVerificationService } from './id-verification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ObjectType()
class IdVerificationResult {
  @Field(() => ID) verificationId!: string;
  @Field() dispensaryId!: string;
  @Field({ nullable: true }) customerId?: string;
  @Field({ nullable: true }) fullName?: string;
  @Field({ nullable: true }) dateOfBirth?: string;
  @Field({ nullable: true }) expiryDate?: string;
  @Field({ nullable: true }) idState?: string;
  @Field({ nullable: true }) idNumber?: string;
  @Field(() => Int, { nullable: true }) age?: number;
  @Field({ nullable: true }) is21Plus?: boolean;
  @Field() verificationStatus!: string;
  @Field({ nullable: true }) verifiedAt?: Date;
  @Field() createdAt!: Date;
}

@Resolver()
export class IdVerificationResolver {
  constructor(private readonly verification: IdVerificationService) {}

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Mutation(() => IdVerificationResult, { name: 'verifyIdentification' })
  async verifyId(
    @Args('image') image: string,
    @Args('dispensaryId', { type: () => ID }) dispensaryId: string,
    @Args('customerId', { type: () => ID, nullable: true }) customerId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdVerificationResult> {
    if (user.role === 'dispensary_admin' && dispensaryId !== user.dispensaryId)
      throw new ForbiddenException('Access denied');
    return this.verification.verifyId({ imageBase64: image, dispensaryId, customerId });
  }

  @Roles('budtender', 'dispensary_admin', 'org_admin', 'super_admin')
  @Query(() => [IdVerificationResult], { name: 'verificationHistory' })
  async getHistory(
    @Args('customerId', { type: () => ID }) customerId: string,
  ): Promise<IdVerificationResult[]> {
    return this.verification.getVerificationHistory(customerId);
  }
}
