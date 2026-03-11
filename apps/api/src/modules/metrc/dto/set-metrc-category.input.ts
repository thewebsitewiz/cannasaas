import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsInt } from 'class-validator';

@InputType()
export class SetMetrcCategoryInput {
  @Field(() => ID) @IsUUID() productId!: string;
  @Field(() => ID) @IsUUID() dispensaryId!: string;
  @Field(() => Int) @IsInt() metrcItemCategoryId!: number;
}
