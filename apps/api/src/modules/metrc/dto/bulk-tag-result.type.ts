import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class BulkTagResultItem {
  @Field(() => ID) productId!: string;
  @Field() productName!: string;
  @Field() success!: boolean;
  @Field({ nullable: true }) error?: string;
}

@ObjectType()
export class BulkTagResult {
  @Field(() => Int) total!: number;
  @Field(() => Int) succeeded!: number;
  @Field(() => Int) failed!: number;
  @Field(() => [BulkTagResultItem]) results!: BulkTagResultItem[];
}
