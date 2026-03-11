import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ProductUidPair {
  @Field(() => ID) @IsUUID() productId!: string;
  @Field() metrcItemUid!: string;
}

@InputType()
export class BulkTagUidInput {
  @Field(() => ID) @IsUUID() dispensaryId!: string;
  @Field(() => [ProductUidPair]) @IsArray() @ValidateNested({ each: true }) @Type(() => ProductUidPair) pairs!: ProductUidPair[];
}
