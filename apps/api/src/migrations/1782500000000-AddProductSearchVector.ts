import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `search_vector` tsvector column to `products`, backing the
 * full-text search in `product-search.service.ts` (sc-748).
 *
 * Postgres-generated column — auto-updates whenever name / strain_name /
 * description change. No application code or trigger needed. Weighted
 * so the product name dominates ranking, strain_name is secondary,
 * description fills in the long tail.
 *
 * GIN index for `@@` matches and `ts_rank()` ordering.
 *
 * The Product entity intentionally does NOT declare this column — it's
 * an internal search index, not a domain field, and TypeORM's
 * `synchronize` is off (post tech-debt #11 / sc-745) so no schema drift
 * complaint.
 */
export class AddProductSearchVector1782500000000 implements MigrationInterface {
  name = 'AddProductSearchVector1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS search_vector tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(strain_name, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'C')
        ) STORED
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_search_vector
        ON products USING GIN (search_vector)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_search_vector`);
    await queryRunner.query(
      `ALTER TABLE products DROP COLUMN IF EXISTS search_vector`,
    );
  }
}
