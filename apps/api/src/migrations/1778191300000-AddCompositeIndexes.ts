/**
 * Retimestamped from `1774500100000` (sc-743). Same fix as the
 * sibling `AddForeignKeyCascades` rename: the original timestamp
 * sorted BEFORE `RenameCamelCaseColumns 1778191000000`, so indexes
 * like `orders (dispensary_id, order_status)` failed on a fresh DB
 * because the columns were still camelCase.
 *
 * Also defensive on tables that aren't currently created by any
 * migration (`time_entries`, `audit_log`, `customer_profiles`) —
 * tracked under the larger baseline-migration follow-up. The
 * `DO $$ IF EXISTS ... END $$` guards skip those indexes on fresh
 * DBs while still creating them on envs where the tables exist
 * (created historically via `synchronize: true`).
 *
 * `idx_orders_dispensary_payment` removed entirely: it referenced
 * `orders.payment_status` which doesn't exist on the `orders` table
 * in any migration. The column name belongs to `purchase_orders`
 * (vendor side) — likely a copy/paste bug in the original migration.
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeIndexes1778191300000 implements MigrationInterface {
  name = 'AddCompositeIndexes1778191300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Orders: frequently filtered by dispensary + status
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_dispensary_status ON orders (dispensary_id, order_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_dispensary_created ON orders (dispensary_id, created_at DESC)`,
    );

    // Inventory: lookup by dispensary + variant
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_inventory_dispensary_variant ON inventory (dispensary_id, variant_id)`,
    );

    // Products: search and filter
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_products_dispensary_type ON products (dispensary_id, product_type_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_products_dispensary_active ON products (dispensary_id) WHERE deleted_at IS NULL`,
    );

    // Metrc sync: status monitoring
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_metrc_sync_status ON metrc_sync_logs (dispensary_id, status)`,
    );

    // Tables below not created by any migration (synchronize:true gap).
    // Guard so fresh DBs skip; envs where the table exists still index.
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_entries') THEN
          CREATE INDEX IF NOT EXISTS idx_time_entries_dispensary_date ON time_entries (dispensary_id, clock_in_at DESC);
        END IF;
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customer_profiles') THEN
          CREATE INDEX IF NOT EXISTS idx_customers_dispensary ON customer_profiles (preferred_dispensary_id);
        END IF;
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_log') THEN
          CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // DROP INDEX IF EXISTS is idempotent regardless of whether the
    // index ever got created (the table-existence guard above means
    // it might not have). Keeping the legacy `idx_orders_dispensary_payment`
    // drop too in case any env still has it from the pre-fix migration.
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_orders_dispensary_status`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_orders_dispensary_created`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_orders_dispensary_payment`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_inventory_dispensary_variant`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_products_dispensary_type`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_products_dispensary_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_time_entries_dispensary_date`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_dispensary`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_metrc_sync_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_entity`);
  }
}
