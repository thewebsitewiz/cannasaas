import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsOptional } from 'class-validator';

@InputType()
export class CompleteOrderInput {
  @Field(() => ID) @IsUUID() orderId!: string;
  @Field(() => ID) @IsUUID() dispensaryId!: string;
  @Field({ nullable: true }) @IsOptional() metrcReceiptId?: string;
  @Field({ nullable: true }) @IsOptional() notes?: string;
}
