import { Injectable, inject } from '@angular/core';
import { AttestKioskDeviceGQL } from '@cannasaas/ui-ng';
import { firstValueFrom } from 'rxjs';

import { clearDeviceKey, loadDeviceKey, storeDeviceKey } from './idb-key-store';

/**
 * Device attestation for the kiosk (sc-474).
 *
 * Flow on /setup:
 *   1. Operator pastes a device token (existing AuthService flow).
 *   2. We call `attestIfNeeded()` — generates a non-extractable ECDSA
 *      P-256 key, persists the private key reference in IndexedDB,
 *      exports the SPKI public key, calls the API's `attestKioskDevice`
 *      mutation.
 *   3. From then on, every GraphQL request is signed via `sign()`
 *      below, called from the Apollo signing link.
 *
 * Recovery:
 *   - If IDB is cleared, `sign()` returns null and the request goes
 *     out unsigned → 401 from the API → operator re-provisions.
 *   - Re-provisioning rotates `current_token_id` AND clears
 *     `kiosk_devices.public_key` on the server, so the next /setup
 *     pass attests a fresh key.
 */
@Injectable({ providedIn: 'root' })
export class DeviceAttestationService {
  private readonly attestGQL = inject(AttestKioskDeviceGQL);

  /**
   * If no key exists locally, generate one and attest it with the API.
   * Idempotent — calling again with a key already present is a no-op.
   * Server-side, `attestKioskDevice` rejects a second attestation
   * unless the device has been re-provisioned (which clears
   * `publicKey`), so we don't double-call it.
   */
  async attestIfNeeded(): Promise<void> {
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
      await firstValueFrom(this.attestGQL.mutate({ variables: { publicKey: pem } }));
    } catch (err) {
      // Attestation failed (network, token expired, server rejected).
      // Roll back the local key so the next /setup pass starts clean.
      await clearDeviceKey();
      throw err;
    }
  }

  /**
   * Signs the canonical string with the persisted private key.
   * Returns `null` if no key is present (legacy device or IDB cleared)
   * — callers should send the request unsigned in that case.
   */
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

  /** Test/admin hook: wipe the local key so /setup re-attests. */
  reset(): Promise<void> {
    return clearDeviceKey();
  }
}

function spkiToPem(der: Uint8Array): string {
  const b64 = bytesToB64(der);
  const lines = b64.match(/.{1,64}/g) ?? [b64];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;
}

function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function bytesToB64Url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
