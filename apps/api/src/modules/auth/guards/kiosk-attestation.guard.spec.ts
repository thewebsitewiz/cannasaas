import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { webcrypto } from 'crypto';

import { KioskAttestationGuard } from './kiosk-attestation.guard';
import { KioskDevicesService } from '../kiosk-devices.service';
import { KioskNonceService } from '../kiosk-nonce.service';
import { KioskDevice } from '../entities/kiosk-device.entity';
import { JwtPayload } from '../strategies/jwt.strategy';

/**
 * The guard's logic is exercised end-to-end with a real ECDSA P-256 key
 * pair generated via `webcrypto.subtle.generateKey`. We sign the same
 * canonical string the client would produce, hand it to the guard via
 * a mocked Express request, and confirm the verify path accepts/rejects
 * as expected.
 */

interface KeyPair {
  publicKeyPem: string;
  privateKey: CryptoKey;
}

async function generateKeyPair(): Promise<KeyPair> {
  const pair = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const spki = await webcrypto.subtle.exportKey('spki', pair.publicKey);
  const b64 = Buffer.from(spki).toString('base64');
  const pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`;
  return { publicKeyPem: pem, privateKey: pair.privateKey };
}

function makeContext(args: {
  user: JwtPayload | null;
  headers?: Record<string, string>;
  rawBody?: Buffer;
  method?: string;
  originalUrl?: string;
}): ExecutionContext {
  const req = {
    user: args.user ?? undefined,
    headers: args.headers ?? {},
    method: args.method ?? 'POST',
    originalUrl: args.originalUrl ?? '/graphql',
    rawBody: args.rawBody,
    body: args.rawBody
      ? (JSON.parse(args.rawBody.toString('utf-8')) as unknown)
      : undefined,
  } as unknown as Request;
  return {
    getType: () => 'http',
    getHandler: () => ({}) as never,
    getClass: () => ({}) as never,
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

function buildSigningString(
  method: string,
  path: string,
  bodyHashHex: string,
  iat: string,
  nonce: string,
): string {
  return [method, path, bodyHashHex, iat, nonce].join('\n');
}

async function signString(
  privateKey: CryptoKey,
  data: string,
): Promise<string> {
  const sig = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(data),
  );
  // base64url (no padding)
  return Buffer.from(sig)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function sha256Hex(buf: Buffer): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(buf).digest('hex');
}

describe('KioskAttestationGuard', () => {
  let guard: KioskAttestationGuard;
  let kioskDevices: { findByUser: jest.Mock };
  let nonces: { consume: jest.Mock };

  beforeEach(async () => {
    kioskDevices = { findByUser: jest.fn() };
    nonces = { consume: jest.fn().mockResolvedValue(true) };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        KioskAttestationGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: () => false },
        },
        { provide: KioskDevicesService, useValue: kioskDevices },
        { provide: KioskNonceService, useValue: nonces },
      ],
    }).compile();
    guard = moduleRef.get(KioskAttestationGuard);
  });

  function kioskUser(): JwtPayload {
    return {
      sub: 'u-kiosk',
      email: 'kiosk-pos-1@disp.kiosk.local',
      role: 'kiosk',
      dispensaryId: 'd-1',
      tokenId: 'tok-1',
    };
  }

  it('passes non-kiosk requests through without a DB lookup', async () => {
    const ctx = makeContext({
      user: { ...kioskUser(), role: 'customer' },
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(kioskDevices.findByUser).not.toHaveBeenCalled();
  });

  it('passes legacy kiosks (no kiosk_devices row) through', async () => {
    kioskDevices.findByUser.mockResolvedValue(null);
    const ctx = makeContext({ user: kioskUser() });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('passes pre-attestation kiosks (publicKey: null) through', async () => {
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: null,
    } as KioskDevice);
    const ctx = makeContext({ user: kioskUser() });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('rejects an attested kiosk with no X-Device-Signature header', async () => {
    const { publicKeyPem } = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: publicKeyPem,
    } as KioskDevice);
    const ctx = makeContext({ user: kioskUser() });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a malformed signature header', async () => {
    const { publicKeyPem } = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: publicKeyPem,
    } as KioskDevice);
    const ctx = makeContext({
      user: kioskUser(),
      headers: { 'x-device-signature': 'not-a-valid-header' },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a stale iat outside the freshness window', async () => {
    const { publicKeyPem, privateKey } = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: publicKeyPem,
    } as KioskDevice);

    const staleIat = String(Date.now() - 5 * 60_000);
    const nonce = 'n-1';
    const body = Buffer.from(JSON.stringify({ query: '{me{id}}' }));
    const bodyHash = sha256Hex(body);
    const sig = await signString(
      privateKey,
      buildSigningString('POST', '/graphql', bodyHash, staleIat, nonce),
    );

    const ctx = makeContext({
      user: kioskUser(),
      headers: { 'x-device-signature': `${staleIat}.${nonce}.${sig}` },
      rawBody: body,
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a replayed nonce', async () => {
    const { publicKeyPem, privateKey } = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: publicKeyPem,
    } as KioskDevice);
    nonces.consume.mockResolvedValue(false);

    const iat = String(Date.now());
    const nonce = 'n-replay';
    const body = Buffer.from('{}');
    const bodyHash = sha256Hex(body);
    const sig = await signString(
      privateKey,
      buildSigningString('POST', '/graphql', bodyHash, iat, nonce),
    );

    const ctx = makeContext({
      user: kioskUser(),
      headers: { 'x-device-signature': `${iat}.${nonce}.${sig}` },
      rawBody: body,
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a bad signature (wrong key)', async () => {
    const real = await generateKeyPair();
    const imposter = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: real.publicKeyPem,
    } as KioskDevice);

    const iat = String(Date.now());
    const nonce = 'n-bad';
    const body = Buffer.from('{}');
    const bodyHash = sha256Hex(body);
    const sig = await signString(
      imposter.privateKey, // wrong key
      buildSigningString('POST', '/graphql', bodyHash, iat, nonce),
    );

    const ctx = makeContext({
      user: kioskUser(),
      headers: { 'x-device-signature': `${iat}.${nonce}.${sig}` },
      rawBody: body,
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a valid signature', async () => {
    const { publicKeyPem, privateKey } = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: publicKeyPem,
    } as KioskDevice);

    const iat = String(Date.now());
    const nonce = 'n-ok';
    const body = Buffer.from(JSON.stringify({ query: '{me{id}}' }));
    const bodyHash = sha256Hex(body);
    const sig = await signString(
      privateKey,
      buildSigningString('POST', '/graphql', bodyHash, iat, nonce),
    );

    const ctx = makeContext({
      user: kioskUser(),
      headers: { 'x-device-signature': `${iat}.${nonce}.${sig}` },
      rawBody: body,
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(nonces.consume).toHaveBeenCalledWith('u-kiosk', 'n-ok');
  });

  it('rejects a body-substitution attack (signature was over a different body)', async () => {
    const { publicKeyPem, privateKey } = await generateKeyPair();
    kioskDevices.findByUser.mockResolvedValue({
      id: 'kd-1',
      userId: 'u-kiosk',
      publicKey: publicKeyPem,
    } as KioskDevice);

    const iat = String(Date.now());
    const nonce = 'n-swap';
    const originalBody = Buffer.from(JSON.stringify({ query: '{me{id}}' }));
    const sig = await signString(
      privateKey,
      buildSigningString(
        'POST',
        '/graphql',
        sha256Hex(originalBody),
        iat,
        nonce,
      ),
    );

    // Replay the signature with a SWAPPED body.
    const swappedBody = Buffer.from(
      JSON.stringify({ query: 'mutation { dangerousThing }' }),
    );
    const ctx = makeContext({
      user: kioskUser(),
      headers: { 'x-device-signature': `${iat}.${nonce}.${sig}` },
      rawBody: swappedBody,
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
