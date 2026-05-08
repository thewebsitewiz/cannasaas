import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID, Length } from 'class-validator';

@InputType()
export class ProvisionKioskInput {
  @Field(() => ID)
  @IsUUID()
  dispensaryId!: string;

  @Field()
  @Length(1, 64)
  label!: string;
}
