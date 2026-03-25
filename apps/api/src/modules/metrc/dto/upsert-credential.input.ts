import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, Length, Matches, IsOptional } from 'class-validator';

@InputType()
export class UpsertCredentialInput {
  @Field() @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field() @IsString() @Length(10, 255) userApiKey!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() integratorApiKey?: string;
  @Field() @Matches(/^[A-Z]{2}$/) state!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() metrcUsername?: string;
}
