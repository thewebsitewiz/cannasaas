import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Kiosk device revocation (sc-192).
 *
 * One row per provisioned (dispensary, label) kiosk. `current_token_id` is
 * the only valid `tokenId` claim that a kiosk JWT may carry for the given
 * user; rotating it during re-provisioning silently invalidates every prior
 * token issued for that kiosk.
 *
 * Legacy kiosks (no row in this table — e.g. the seeded `kiosk@greenleaf.com`
 * service account) bypass the check and continue to work. The validation
 * lookup is conditional on row existence; once a kiosk is provisioned via
 * the new flow, every subsequent token for that user must match.
 */
export class CreateKioskDevices1779408000000 implements MigrationInterface {
  name = 'CreateKioskDevices1779408000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE kiosk_devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        dispensary_id UUID NOT NULL REFERENCES dispensaries(entity_id) ON DELETE CASCADE,
        label VARCHAR NOT NULL,
        current_token_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await qr.query(
      `CREATE UNIQUE INDEX idx_kiosk_devices_user ON kiosk_devices (user_id)`,
    );
    await qr.query(
      `CREATE INDEX idx_kiosk_devices_dispensary ON kiosk_devices (dispensary_id)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_kiosk_devices_dispensary`);
    await qr.query(`DROP INDEX IF EXISTS idx_kiosk_devices_user`);
    await qr.query(`DROP TABLE IF EXISTS kiosk_devices`);
  }
}
