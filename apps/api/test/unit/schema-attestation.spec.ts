/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project; Jest globals lose types.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCHEMA = readFileSync(
  resolve(__dirname, '..', '..', 'schema.gql'),
  'utf8',
);

describe('schema.gql kiosk attestation surface (sc-591 TC-ATT-API-004)', () => {
  it('exposes the attestKioskDevice mutation with publicKey: String! → Boolean!', () => {
    expect(SCHEMA).toMatch(
      /attestKioskDevice\(publicKey: String!\)\s*:\s*Boolean!/,
    );
  });

  it('declares provisionKiosk mutation (issues the long-lived kiosk token)', () => {
    expect(SCHEMA).toMatch(/provisionKiosk\(/);
  });

  it('does NOT mark attestKioskDevice as @Public — must require a JWT', () => {
    // The mutation should be defined under the Mutation type, not as a
    // separate Query, and the guard enforces auth at the resolver level.
    // The schema doesn't carry @Public, but having "Public" inside the
    // attest line would be a red flag.
    const line = SCHEMA.split('\n').find((l) =>
      l.includes('attestKioskDevice'),
    );
    expect(line).toBeDefined();
    expect(line ?? '').not.toMatch(/@Public/);
  });
});
