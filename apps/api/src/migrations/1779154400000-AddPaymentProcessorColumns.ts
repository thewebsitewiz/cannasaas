import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds processor identification + failure tracking to the payments table so
 * webhook-driven lifecycle events (sc-211) can locate the correct row.
 *
 * - processor_name + processor_transaction_id pair identifies a payment with
 *   the external processor. Cash payments leave these NULL.
 * - failure_reason captures the human-readable reason the processor gave
 *   when a payment fails.
 * - Partial unique index ensures one Payment per (processor_name,
 *   processor_transaction_id) pair while still allowing multiple cash
 *   payments (both columns NULL) per order.
 */
export class AddPaymentProcessorColumns1779154400000 implements MigrationInterface {
  name = 'AddPaymentProcessorColumns1779154400000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE payments ADD COLUMN processor_name VARCHAR(32)`,
    );
    await qr.query(
      `ALTER TABLE payments ADD COLUMN processor_transaction_id VARCHAR(128)`,
    );
    await qr.query(`ALTER TABLE payments ADD COLUMN failure_reason TEXT`);
    await qr.query(`
      CREATE UNIQUE INDEX idx_payments_processor_tx
      ON payments (processor_name, processor_transaction_id)
      WHERE processor_name IS NOT NULL AND processor_transaction_id IS NOT NULL
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_payments_processor_tx`);
    await qr.query(`ALTER TABLE payments DROP COLUMN IF EXISTS failure_reason`);
    await qr.query(
      `ALTER TABLE payments DROP COLUMN IF EXISTS processor_transaction_id`,
    );
    await qr.query(`ALTER TABLE payments DROP COLUMN IF EXISTS processor_name`);
  }
}
