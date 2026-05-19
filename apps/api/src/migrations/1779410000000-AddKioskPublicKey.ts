import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Kiosk device attestation (sc-474).
 *
 * Adds the public-key column for ECDSA P-256 attestation. The kiosk
 * generates a non-extractable CryptoKey during /setup and exports the
 * SPKI public key via `attestKioskDevice`. Every subsequent request
 * from that device must carry an `X-Device-Signature` header signed
 * with the matching private key.
 *
 * Column is nullable: legacy kiosks (provisioned before sc-474) have
 * `public_key IS NULL` and the attestation guard skips signature
 * verification for them. Once a kiosk re-provisions through the new
 * flow it attests, populates `public_key`, and from that point on
 * every request from that device must be signed.
 */
export class AddKioskPublicKey1779410000000 implements MigrationInterface {
  name = 'AddKioskPublicKey1779410000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE kiosk_devices ADD COLUMN public_key TEXT`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE kiosk_devices DROP COLUMN IF EXISTS public_key`);
  }
}
