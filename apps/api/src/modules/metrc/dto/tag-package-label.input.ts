import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsString, Length } from 'class-validator';

@InputType()
export class TagPackageLabelInput {
  @Field(() => ID) @IsUUID() variantId!: string;
  @Field(() => ID) @IsUUID() dispensaryId!: string;
  @Field() @IsString() @Length(1, 100) metrcPackageLabel!: string;
}
