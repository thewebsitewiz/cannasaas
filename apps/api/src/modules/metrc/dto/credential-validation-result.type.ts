import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CredentialValidationResult {
  @Field() valid!: boolean;
  @Field({ nullable: true }) message?: string;
  @Field({ nullable: true }) metrcFacilityName?: string;
  @Field({ nullable: true }) licenseNumber?: string;
  @Field({ nullable: true }) licenseType?: string;
}
