import { InputType, Field, ID, ObjectType } from '@nestjs/graphql';
import { IsUUID, IsArray, ValidateNested, IsString, Matches, } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ProductUidPair {
  @Field(() => ID)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  productId!: string;

  @Field()
  @IsString()
  metrcItemUid!: string;
}

@InputType()
export class BulkTagUidInput {
  @Field(() => ID)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
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
