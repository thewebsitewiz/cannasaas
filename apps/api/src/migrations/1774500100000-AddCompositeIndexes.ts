import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositeIndexes1774500100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Orders: frequently filtered by dispensary + status
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_dispensary_status ON orders (dispensary_id, order_status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_dispensary_created ON orders (dispensary_id, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_orders_dispensary_payment ON orders (dispensary_id, payment_status)`);

    // Inventory: lookup by dispensary + variant
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_inventory_dispensary_variant ON inventory (dispensary_id, variant_id)`);

    // Products: search and filter
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_products_dispensary_type ON products (dispensary_id, product_type_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_products_dispensary_active ON products (dispensary_id) WHERE deleted_at IS NULL`);

    // Time entries: payroll queries
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_dispensary_date ON time_entries (dispensary_id, clock_in_at DESC)`);

    // Customer profiles: lookup
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_customers_dispensary ON customer_profiles (preferred_dispensary_id)`);

    // Metrc sync: status monitoring
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_metrc_sync_status ON metrc_sync_logs (dispensary_id, status)`);

    // Audit log: entity lookup
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log (entity_type, entity_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_dispensary_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_dispensary_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_dispensary_payment`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_inventory_dispensary_variant`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_dispensary_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_dispensary_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_time_entries_dispensary_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_customers_dispensary`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_metrc_sync_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_entity`);
  }
}
