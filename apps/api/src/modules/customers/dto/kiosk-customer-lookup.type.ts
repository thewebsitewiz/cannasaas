import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * Lightweight kiosk-facing customer record. Joins customer_profiles with
 * users so the kiosk can greet by name without exposing the full
 * CustomerProfile shape. Returned by the `customerByPhone` query.
 */
@ObjectType()
export class KioskCustomerLookup {
  @Field(() => ID)
  customerId!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(() => Int)
  loyaltyPoints!: number;
}
