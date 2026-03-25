import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsUUID, IsInt, Matches, } from 'class-validator';

@InputType()
export class SetMetrcCategoryInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) productId!: string;
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field(() => Int) @IsInt() metrcItemCategoryId!: number;
}
