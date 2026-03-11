import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsUUID, IsArray, ValidateNested, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class OrderLineItemInput {
  @Field(() => ID) @IsUUID() productId!: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() variantId?: string;
  @Field(() => Float) @Min(0.0001) quantity!: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID) @IsUUID() dispensaryId!: string;
  @Field(() => ID, { nullable: true }) @IsOptional() @IsUUID() customerUserId?: string;
  @Field({ nullable: true }) @IsOptional() @IsIn(['pickup', 'delivery', 'in_store']) orderType?: string;
  @Field(() => [OrderLineItemInput]) @IsArray() @ValidateNested({ each: true }) @Type(() => OrderLineItemInput) lineItems!: OrderLineItemInput[];
  @Field({ nullable: true }) @IsOptional() notes?: string;
}
