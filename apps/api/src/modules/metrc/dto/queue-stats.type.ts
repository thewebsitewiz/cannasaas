import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Live BullMQ counts for the `metrc-sync` queue. Used by the
 * operator surface to answer "is the queue actually processing right
 * now, and is anything stuck?" — distinct from the `failedMetrcSyncs`
 * query, which reads from the `orders` table and shows database-level
 * sync state (a row in `metricSyncStatus = 'failed'` is the user-visible
 * symptom; this counts the underlying queue jobs).
 *
 * `failed` here is the BullMQ failed bin (jobs that exhausted retries
 * inside the worker). For pre-sc-225 orders with `metrcSyncStatus =
 * 'failed'` but no associated queue job, see `failedMetrcSyncs`.
 */
@ObjectType()
export class MetrcSyncQueueStats {
  @Field(() => Int) waiting!: number;
  @Field(() => Int) active!: number;
  @Field(() => Int) failed!: number;
  @Field(() => Int) completed!: number;
  @Field(() => Int) delayed!: number;
}
