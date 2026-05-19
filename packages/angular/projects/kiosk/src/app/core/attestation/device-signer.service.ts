import { Injectable } from '@angular/core';

import { loadDeviceKey } from './idb-key-store';

/**
 * Per-request signing for the kiosk (sc-474).
 *
 * Split out from the broader `DeviceAttestationService` so the
 * heavyweight attestation flow (key generation + `AttestKioskDeviceGQL`
 * mutation) lives only in the `/setup` lazy chunk. The signing path is
 * tiny — just `crypto.subtle.sign()` against the persisted IDB key —
 * and is the one piece every kiosk-role GraphQL request needs.
 *
 * Returns `null` when there's no key (legacy device or post-clear-IDB
 * state). The Apollo signature link interprets `null` as "send
 * unsigned" — the API's `KioskAttestationGuard` accepts that path for
 * devices whose `kiosk_devices.public_key` is null and rejects it once
 * the device has been attested.
 */
@Injectable({ providedIn: 'root' })
export class DeviceSignerService {
  async sign(stringToSign: string): Promise<string | null> {
    if (typeof indexedDB === 'undefined' || typeof crypto === 'undefined') {
      return null;
    }
    const key = await loadDeviceKey();
    if (!key) return null;
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      new TextEncoder().encode(stringToSign),
    );
    return bytesToB64Url(new Uint8Array(sig));
  }
}

function bytesToB64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
