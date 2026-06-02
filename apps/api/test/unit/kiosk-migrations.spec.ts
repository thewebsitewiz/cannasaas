/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIGRATIONS_DIR = resolve(__dirname, '..', '..', 'src', 'migrations');

function readMigration(filename: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, filename), 'utf8');
}

describe('CreateKioskDevices1779408000000 (sc-596 TC-MIG-001, sc-597 TC-MIG-002)', () => {
  const source = readMigration('1779408000000-CreateKioskDevices.ts');

  // TC-MIG-001 — Create migration up

  it('class name and table name match the convention', () => {
    expect(source).toMatch(/export class CreateKioskDevices1779408000000/);
    expect(source).toMatch(/CREATE TABLE kiosk_devices/);
  });

  it('up creates the expected columns', () => {
    const REQUIRED_COLS = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid\\(\\)',
      'user_id UUID NOT NULL REFERENCES users\\(user_id\\) ON DELETE CASCADE',
      'dispensary_id UUID NOT NULL REFERENCES dispensaries\\(entity_id\\) ON DELETE CASCADE',
      'label VARCHAR NOT NULL',
      'current_token_id UUID NOT NULL',
      'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW\\(\\)',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW\\(\\)',
    ];
    for (const col of REQUIRED_COLS) {
      expect(source).toMatch(new RegExp(col));
    }
  });

  it('up creates a UNIQUE index on (user_id) — enforces one device per kiosk user', () => {
    expect(source).toMatch(
      /CREATE UNIQUE INDEX idx_kiosk_devices_user ON kiosk_devices \(user_id\)/,
    );
  });

  it('up creates a non-unique index on (dispensary_id) for tenant lookups', () => {
    expect(source).toMatch(
      /CREATE INDEX idx_kiosk_devices_dispensary ON kiosk_devices \(dispensary_id\)/,
    );
  });

  // TC-MIG-002 — Create migration down

  it('down drops the table and both indexes (IF EXISTS for idempotence)', () => {
    expect(source).toMatch(/DROP INDEX IF EXISTS idx_kiosk_devices_dispensary/);
    expect(source).toMatch(/DROP INDEX IF EXISTS idx_kiosk_devices_user/);
    expect(source).toMatch(/DROP TABLE IF EXISTS kiosk_devices/);
  });

  it('down drops indexes before dropping the table (correct ordering)', () => {
    const idxPos = source.indexOf(
      'DROP INDEX IF EXISTS idx_kiosk_devices_dispensary',
    );
    const tablePos = source.indexOf('DROP TABLE IF EXISTS kiosk_devices');
    expect(idxPos).toBeGreaterThan(0);
    expect(tablePos).toBeGreaterThan(idxPos);
  });
});

describe('AddKioskPublicKey1779410000000 (sc-598 TC-MIG-003, sc-599 TC-MIG-004)', () => {
  const source = readMigration('1779410000000-AddKioskPublicKey.ts');

  // TC-MIG-003 — Add column up

  it('class name and altered table match the convention', () => {
    expect(source).toMatch(/export class AddKioskPublicKey1779410000000/);
    expect(source).toMatch(/ALTER TABLE kiosk_devices/);
  });

  it('up adds a nullable TEXT column named public_key (legacy kiosks need to opt-in)', () => {
    expect(source).toMatch(/ADD COLUMN public_key TEXT(?! NOT NULL)/);
  });

  // TC-MIG-004 — Add column down

  it('down drops the public_key column with IF EXISTS', () => {
    expect(source).toMatch(/DROP COLUMN IF EXISTS public_key/);
  });
});
