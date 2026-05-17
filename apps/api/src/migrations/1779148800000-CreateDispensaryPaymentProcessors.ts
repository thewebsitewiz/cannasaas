import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-dispensary payment processor config (sc-209).
 *
 * - Creates dispensary_payment_processors (one row per dispensary × processor)
 * - Adds dispensaries.active_payment_processor (which enabled processor is default)
 * - Drops legacy boolean flags canpay_enabled / aeropay_enabled that were
 *   referenced by CashlessPaymentsService raw SQL but never landed in any
 *   migration. The new table supersedes them.
 */
export class CreateDispensaryPaymentProcessors1779148800000 implements MigrationInterface {
  name = 'CreateDispensaryPaymentProcessors1779148800000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE dispensary_payment_processors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dispensary_id UUID NOT NULL REFERENCES dispensaries(entity_id) ON DELETE CASCADE,
        processor_name TEXT NOT NULL CHECK (processor_name IN ('aeropay', 'canpay')),
        is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        is_sandbox BOOLEAN NOT NULL DEFAULT TRUE,
        credentials_encrypted TEXT,
        merchant_external_id TEXT,
        provisioned_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uniq_dpp_dispensary_processor UNIQUE (dispensary_id, processor_name)
      )
    `);

    await qr.query(
      `CREATE INDEX idx_dpp_dispensary ON dispensary_payment_processors (dispensary_id)`,
    );

    await qr.query(`
      ALTER TABLE dispensaries
      ADD COLUMN active_payment_processor TEXT
      CHECK (active_payment_processor IN ('aeropay', 'canpay'))
    `);

    await qr.query(
      `ALTER TABLE dispensaries DROP COLUMN IF EXISTS canpay_enabled`,
    );
    await qr.query(
      `ALTER TABLE dispensaries DROP COLUMN IF EXISTS aeropay_enabled`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE dispensaries DROP COLUMN IF EXISTS active_payment_processor`,
    );
    await qr.query(`DROP TABLE IF EXISTS dispensary_payment_processors`);
    // Intentionally do not recreate the legacy canpay_enabled / aeropay_enabled
    // flags — they were never migrated cleanly and the codebase no longer
    // references them after sc-209.
  }
}
