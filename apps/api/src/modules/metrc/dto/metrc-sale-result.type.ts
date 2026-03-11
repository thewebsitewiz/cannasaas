import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class MetrcSaleResult {
  @Field() success!: boolean;
  @Field({ nullable: true }) metrcReceiptId?: string;
  @Field({ nullable: true }) message?: string;
  @Field({ nullable: true }) syncLogId?: string;
}
