import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renamed + retimestamped from `AddDesignSystem1711200000000` (sc-741).
 *
 * The original timestamp (March 2024) sorted BEFORE `InitialSchema`
 * (May 2025, 1773159747693), so on a fresh DB TypeORM tried to
 * `ALTER TABLE "dispensaries"` before the table existed. Existing
 * environments never noticed because they already had the
 * `dispensaries` table (from a prior successful run with the wrong
 * class name in the migrations table).
 *
 * Idempotent body — `ADD COLUMN IF NOT EXISTS` / `DROP COLUMN IF
 * EXISTS` — so environments that already ran the old-named migration
 * survive the no-op re-run when TypeORM sees the new class name as
 * an un-recorded migration.
 */
export class AddDesignSystem1780400000000 implements MigrationInterface {
  name = 'AddDesignSystem1780400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dispensaries"
        ADD COLUMN IF NOT EXISTS "design_system" varchar(50) NOT NULL DEFAULT 'casual',
        ADD COLUMN IF NOT EXISTS "design_system_file" varchar(100) NOT NULL DEFAULT 'casual.css'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "dispensaries"
        DROP COLUMN IF EXISTS "design_system_file",
        DROP COLUMN IF EXISTS "design_system"
    `);
  }
}
