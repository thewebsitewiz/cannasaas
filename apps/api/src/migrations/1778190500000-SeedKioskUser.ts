import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds a default kiosk service-account user used by self-service terminals.
 *
 * - Email: `kiosk@greenleaf.com`
 * - Role: `kiosk` (introduced alongside this seed; see Role enum)
 * - Password: `password123` (dev-only — production deployments should rotate
 *   this immediately and provision device tokens via `provisionKiosk`)
 * - Dispensary: `c0000000-0000-0000-0000-000000000001` (the "Tappan" test dispensary)
 *
 * The bcrypt hash below was generated once with cost 12 from `password123`. We
 * embed the literal so the migration has zero runtime deps and is fast.
 *
 * Idempotency: ON CONFLICT (email) leaves an existing row untouched, so this
 * migration is safe to apply on a DB that was previously hand-seeded.
 *
 * Note: the target dispensary is currently seeded outside the migration system
 * (see `tenant-seed.ts` or out-of-band SQL). On a truly fresh DB the kiosk user
 * row will exist but won't be useful until the dispensary is seeded.
 */
const KIOSK_USER_ID = 'b8f0f2ae-826e-4146-beeb-1c1086fe3234';
const KIOSK_EMAIL = 'kiosk@greenleaf.com';
const KIOSK_DISPENSARY_ID = 'c0000000-0000-0000-0000-000000000001';
// bcrypt hash of "password123" at cost 12 — DEV CREDENTIALS ONLY
const KIOSK_PASSWORD_HASH =
  '$2b$12$ZCRUXuXUrbG6NrH6U7.Hxu6zILrLF4X4zF8kfx.ynH1zwheRTWv6q';

export class SeedKioskUser1778190500000 implements MigrationInterface {
  name = 'SeedKioskUser1778190500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO users
        (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "emailVerified", "dispensaryId")
       VALUES ($1, $2, $3, 'kiosk', 'Kiosk', 'Service', true, true, $4)
       ON CONFLICT (email) DO NOTHING`,
      [KIOSK_USER_ID, KIOSK_EMAIL, KIOSK_PASSWORD_HASH, KIOSK_DISPENSARY_ID],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email = $1`, [
      KIOSK_EMAIL,
    ]);
  }
}
