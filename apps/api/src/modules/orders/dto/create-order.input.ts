import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { Matches, IsUUID, IsArray, ValidateNested, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class OrderLineItemInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) productId!: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) variantId?: string;
  @Field(() => Float) @Min(0.0001) quantity!: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) customerUserId?: string;
  @Field({ nullable: true }) @IsOptional() @IsIn(['pickup', 'delivery', 'in_store']) orderType?: string;
  @Field(() => [OrderLineItemInput]) @IsArray() @ValidateNested({ each: true }) @Type(() => OrderLineItemInput) lineItems!: OrderLineItemInput[];
  @Field({ nullable: true }) @IsOptional() notes?: string;
}
