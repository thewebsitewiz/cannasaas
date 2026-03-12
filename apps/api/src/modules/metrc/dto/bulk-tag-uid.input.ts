import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';
import { IsUUID, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ProductUidPair {
  @Field(() => ID)
  @IsUUID()
  productId!: string;

  @Field()
  @IsString()
  metrcItemUid!: string;
}

@InputType()
export class BulkTagUidInput {
  @Field(() => ID)
  @IsUUID()
  dispensaryId!: string;

  @Field(() => [ProductUidPair])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUidPair)
  pairs!: ProductUidPair[];
}

@ObjectType()
export class BulkTagUidResult {
  @Field() total!: number;
  @Field() succeeded!: number;
  @Field() failed!: number;
}
