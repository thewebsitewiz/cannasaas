import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tech-debt row #15. The original `AddForeignKeyCascades1774500000000`
 * migration declared three FKs that point at `users` —
 * `fk_customer_user`, `fk_employee_user`, `fk_refresh_user`. Some
 * environments that ran that migration before sc-708/sc-709 are
 * suspected to be missing one or more of those FKs (the matching bug
 * pattern silently dropped the post-typo FKs in some Postgres
 * setups).
 *
 * This migration is a forward-only backfill: idempotent
 * `DROP CONSTRAINT IF EXISTS` followed by `ADD CONSTRAINT`. Envs that
 * already have the FK get the same shape; envs that lost it get it
 * back. The `down` is a no-op — reverting cascades on running envs
 * would be more dangerous than the original gap.
 */
export class BackfillUserCascadeFKs1780300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // customer_profiles -> users
    await queryRunner.query(
      `ALTER TABLE customer_profiles DROP CONSTRAINT IF EXISTS fk_customer_user`,
    );
    await queryRunner.query(
      `ALTER TABLE customer_profiles ADD CONSTRAINT fk_customer_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
    );

    // employee_profiles -> users
    await queryRunner.query(
      `ALTER TABLE employee_profiles DROP CONSTRAINT IF EXISTS fk_employee_user`,
    );
    await queryRunner.query(
      `ALTER TABLE employee_profiles ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
    );

    // refresh_tokens -> users
    await queryRunner.query(
      `ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS fk_refresh_user`,
    );
    await queryRunner.query(
      `ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
    );
  }

  public async down(): Promise<void> {
    // No-op. Reverting cascade FKs on a running environment would risk
    // leaving the DB in a worse state than the gap this migration fixed.
  }
}
