import { InputType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class ValidateCredentialInput {
  @Field() @IsUUID() dispensaryId!: string;
}
