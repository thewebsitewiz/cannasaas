import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional, Matches, } from 'class-validator';

@InputType()
export class CompleteOrderInput {
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) orderId!: string;
  @Field(() => ID) @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) dispensaryId!: string;
  @Field({ nullable: true }) @IsOptional() metrcReceiptId?: string;
  @Field({ nullable: true }) @IsOptional() notes?: string;
}
