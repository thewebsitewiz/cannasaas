import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class TaxLineItem {
  @Field() label!: string;
  @Field() ratePercent!: number;
  @Field(() => Float) amount!: number;
}

@ObjectType()
export class OrderSummary {
  @Field(() => ID) orderId!: string;
  @Field(() => ID) dispensaryId!: string;
  @Field() orderStatus!: string;
  @Field() orderType!: string;
  @Field(() => Float) subtotal!: number;
  @Field(() => Float) discountTotal!: number;
  @Field(() => Float) taxTotal!: number;
  @Field(() => Float) total!: number;
  @Field(() => [TaxLineItem]) taxBreakdown!: TaxLineItem[];
  @Field(() => Int) lineItemCount!: number;
  @Field(() => Date) createdAt!: Date;
}
