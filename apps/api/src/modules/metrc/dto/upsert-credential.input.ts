import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString, Length, IsIn, IsOptional } from 'class-validator';

@InputType()
export class UpsertCredentialInput {
  @Field() @IsUUID() dispensaryId!: string;
  @Field() @IsString() @Length(10, 255) userApiKey!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() integratorApiKey?: string;
  @Field() @IsIn(['NY', 'NJ', 'CT']) state!: string;
  @Field({ nullable: true }) @IsOptional() @IsString() metrcUsername?: string;
}
