import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds `sort_order` to `products` so the admin can persist a
 * per-dispensary manual product ordering (sc-682c).
 *
 * Nullable + no default so existing rows aren't bulk-touched; the
 * products query orders by COALESCE(sort_order, 999999), name so
 * untouched rows continue to sort by name as before.
 *
 * The composite index speeds up the dispensary-scoped read path.
 */
export class AddProductSortOrder1780000000000 implements MigrationInterface {
  name = 'AddProductSortOrder1780000000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER`,
    );
    await qr.query(
      `CREATE INDEX IF NOT EXISTS idx_products_dispensary_sort_order ON products (dispensary_id, sort_order)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_products_dispensary_sort_order`);
    await qr.query(`ALTER TABLE products DROP COLUMN IF EXISTS sort_order`);
  }
}
