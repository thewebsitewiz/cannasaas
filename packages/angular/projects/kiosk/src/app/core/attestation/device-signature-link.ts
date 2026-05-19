import { HttpHeaders } from '@angular/common/http';
import { ApolloLink, type Operation } from '@apollo/client';
import { Observable } from 'rxjs';

import { DeviceAttestationService } from './device-attestation.service';

/**
 * Apollo link that signs every outgoing GraphQL operation with the
 * kiosk's persisted ECDSA P-256 key (sc-474).
 *
 * Header format: `<iat-ms>.<nonce>.<sig-base64url>`
 *
 * Signing string (newline-joined):
 *   <upper-method>\n<path>\n<sha256-hex-of-body>\n<iat-ms>\n<nonce>
 *
 * The link queries `DeviceAttestationService.sign` per request, which
 * resolves the IDB key lazily. If no key is present (legacy device or
 * post-wipe state) the request goes out unsigned — the server's
 * `KioskAttestationGuard` accepts that for devices whose
 * `kiosk_devices.public_key` is still null, and rejects it once the
 * device has been attested.
 */
export function createDeviceSignatureLink(attestation: DeviceAttestationService): ApolloLink {
  return new ApolloLink((operation, forward) => {
    return new Observable((subscriber) => {
      void buildAndAttach(operation, attestation).then(
        () => {
          forward(operation).subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        },
        (err: unknown) => subscriber.error(err),
      );
    });
  });
}

async function buildAndAttach(
  operation: Operation,
  attestation: DeviceAttestationService,
): Promise<void> {
  const body: unknown = {
    operationName: operation.operationName,
    variables: operation.variables,
    query: operation.query.loc?.source.body ?? '',
  };
  const bodyHash = await sha256Hex(JSON.stringify(body));
  const iat = String(Date.now());
  const nonce = randomNonce();
  const stringToSign = ['POST', '/graphql', bodyHash, iat, nonce].join('\n');
  const sig = await attestation.sign(stringToSign);
  if (!sig) return; // legacy device — let the request go out unsigned

  const context = operation.getContext() as { headers?: HttpHeaders };
  const existing = context.headers ?? new HttpHeaders();
  operation.setContext({
    headers: existing.set('X-Device-Signature', `${iat}.${nonce}.${sig}`),
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}
