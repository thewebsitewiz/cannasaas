import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, Length, Matches, IsOptional } from 'class-validator';

@InputType()
export class UpsertCredentialInput {
  @Field() @IsUUID() dispensaryId!: string;
  @Field() @IsString() @Length(10, 255) userApiKey!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() integratorApiKey?: string;
  @Field() @Matches(/^[A-Z]{2}$/) state!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() metrcUsername?: string;
}
