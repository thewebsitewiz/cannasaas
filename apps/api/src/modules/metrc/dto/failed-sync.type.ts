import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class FailedSyncItem {
  @Field(() => ID) orderId!: string;
  @Field() orderStatus!: string;
  @Field() metrcSyncStatus!: string;
  @Field({ nullable: true }) metrcReportedAt?: string;
  @Field() subtotal!: number;
  @Field() total!: number;
  @Field() createdAt!: string;
  @Field({ nullable: true }) lastSyncAttempt?: string;
  @Field({ nullable: true }) lastSyncError?: string;
  @Field() attemptCount!: number;
}

@ObjectType()
export class FailedSyncDashboard {
  @Field() dispensaryId!: string;
  @Field() totalFailed!: number;
  @Field() oldestFailedAt?: string;
  @Field(() => [FailedSyncItem]) items!: FailedSyncItem[];
}
