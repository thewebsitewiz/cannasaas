import { AttestKioskDeviceGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';

import {
  clearDeviceKey,
  loadDeviceKey,
  storeDeviceKey,
} from '../../core/attestation/idb-key-store';

/**
 * One-shot device attestation, called from the SetupPage component.
 *
 * Co-located with /setup (a lazy-loaded route) so the heavyweight
 * `AttestKioskDeviceGQL` import and the WebCrypto key-gen logic don't
 * land in the initial bundle. Per-request signing lives in the much
 * smaller `DeviceSignerService` (sc-474 follow-up — kiosk bundle trim).
 *
 * Idempotent: if an IDB key already exists this is a no-op. Server
 * rejects a second `attestKioskDevice` against the same row, so we
 * don't double-call.
 */
export async function attestDeviceIfNeeded(
  attestGQL: AttestKioskDeviceGQL,
): Promise<void> {
  if (typeof indexedDB === 'undefined' || typeof crypto === 'undefined') {
    throw new Error('Device attestation requires IndexedDB + WebCrypto');
  }
  const existing = await loadDeviceKey();
  if (existing) return;

  // `extractable: false` on the pair means the PRIVATE key cannot be
  // exfiltrated via `exportKey`. The PUBLIC key half is always
  // exportable regardless of the flag — that's what we send to the
  // server, and what stays usable for verification.
  const pair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    /* extractable */ false,
    ['sign'],
  );
  const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
  const pem = spkiToPem(new Uint8Array(spki));

  await storeDeviceKey(pair.privateKey);

  try {
    await firstValueFrom(
      attestGQL.mutate({ variables: { publicKey: pem } }),
    );
  } catch (err) {
    // Attestation failed (network, token expired, server rejected).
    // Roll back the local key so the next /setup pass starts clean.
    await clearDeviceKey();
    throw err;
  }
}

function spkiToPem(der: Uint8Array): string {
  let s = '';
  for (const b of der) s += String.fromCharCode(b);
  const b64 = btoa(s);
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}
