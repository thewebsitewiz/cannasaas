import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class KioskProvisionResult {
  @Field()
  deviceToken!: string;

  @Field(() => ID)
  deviceId!: string;

  @Field(() => ID)
  dispensaryId!: string;

  @Field()
  label!: string;

  @Field()
  issuedAt!: Date;

  @Field()
  expiresAt!: Date;
}
