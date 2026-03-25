import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, Matches, } from 'class-validator';

@InputType()
export class ValidateCredentialInput {
  @Field() @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
}
