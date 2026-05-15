import { InputType, Field, ID, Float } from '@nestjs/graphql';
import {
  Matches,
  IsArray,
  ValidateNested,
  IsOptional,
  IsIn,
  Min,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class OrderLineItemInput {
  @Field(() => ID)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  productId!: string;
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  variantId?: string;
  @Field(() => Float) @Min(0.0001) quantity!: number;
}

@InputType()
export class DeliveryAddressInput {
  @Field() @Length(1, 255) line1!: string;
  @Field({ nullable: true }) @IsOptional() @Length(1, 255) line2?: string;
  @Field() @Length(1, 100) city!: string;
  @Field() @Length(2, 2) state!: string;
  @Field() @Length(3, 20) postalCode!: string;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsLatitude()
  latitude?: number;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  zoneId?: string;
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  deliveryFee?: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  dispensaryId!: string;
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  customerUserId?: string;
  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['pickup', 'delivery', 'in_store'])
  orderType?: string;
  @Field(() => [OrderLineItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineItemInput)
  lineItems!: OrderLineItemInput[];
  @Field({ nullable: true }) @IsOptional() notes?: string;
  @Field(() => DeliveryAddressInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressInput)
  deliveryAddress?: DeliveryAddressInput;
  @Field({ nullable: true })
  @IsOptional()
  @IsISO8601()
  scheduledFor?: string;
}
