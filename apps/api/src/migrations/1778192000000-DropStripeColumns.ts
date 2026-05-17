import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop Stripe-related columns from payments, organizations, and dispensaries.
 *
 * Rationale: Stripe ToS prohibits cannabis transactions. The platform uses a
 * cannabis-friendly payment processor; the Stripe-specific columns are dead.
 *
 * Down() restores the columns as nullable but does NOT repopulate them —
 * the historical data is lost on rollback.
 */
export class DropStripeColumns1778192000000 implements MigrationInterface {
  name = 'DropStripeColumns1778192000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payments DROP COLUMN IF EXISTS stripe_payment_intent_id`,
    );
    await queryRunner.query(
      `ALTER TABLE payments DROP COLUMN IF EXISTS stripe_charge_id`,
    );
    await queryRunner.query(
      `ALTER TABLE organizations DROP COLUMN IF EXISTS stripe_customer_id`,
    );
    await queryRunner.query(
      `ALTER TABLE dispensaries DROP COLUMN IF EXISTS stripe_enabled`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payments ADD COLUMN stripe_payment_intent_id varchar(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE payments ADD COLUMN stripe_charge_id varchar(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE organizations ADD COLUMN stripe_customer_id varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE dispensaries ADD COLUMN stripe_enabled boolean DEFAULT false`,
    );
  }
}
