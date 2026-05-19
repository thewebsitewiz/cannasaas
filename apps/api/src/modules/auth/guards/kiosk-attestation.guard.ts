import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { webcrypto } from 'crypto';
import { Request } from 'express';

import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { KioskDevicesService } from '../kiosk-devices.service';
import { KioskNonceService } from '../kiosk-nonce.service';
import { JwtPayload } from '../strategies/jwt.strategy';

/**
 * Verifies the `X-Device-Signature` header on every kiosk-role request
 * whose underlying device has been attested (i.e. has a non-null
 * `publicKey`).
 *
 * Sequenced AFTER `JwtAuthGuard` + `RolesGuard` (which already populate
 * `req.user`). Skipped for:
 * - non-kiosk roles (signature only applies to kiosk tokens)
 * - `@Public()` endpoints (login, register, the kiosk's own
 *   `attestKioskDevice` mutation is NOT @Public — see resolver: it
 *   relies on the JWT being valid but the device not yet attested,
 *   which means `device.publicKey IS NULL` and this guard is bypassed)
 * - legacy kiosks where `device.publicKey IS NULL`
 *
 * Header format: `<iat-ms>.<nonce>.<sig-base64url>` where `iat-ms` is the
 * client's `Date.now()` (unix epoch milliseconds; no dots in the value).
 *
 * Signing string (newline-joined):
 *   <upper-method>\n<path>\n<sha256-hex-of-body>\n<iat-ms>\n<nonce>
 *
 * Replay protection: 60 s `iat` freshness + 90 s sliding-window nonce
 * cache via `KioskNonceService`.
 */
@Injectable()
export class KioskAttestationGuard implements CanActivate {
  private static readonly IAT_SKEW_MS = 60_000;
  private static readonly SIGNATURE_HEADER = 'x-device-signature';

  private readonly logger = new Logger(KioskAttestationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly kioskDevices: KioskDevicesService,
    private readonly nonces: KioskNonceService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = this.getRequest(context);
    const user = req.user as JwtPayload | undefined;
    if (!user || user.role !== 'kiosk') return true;

    const device = await this.kioskDevices.findByUser(user.sub);
    if (!device || !device.publicKey) {
      // Pre-attestation request (e.g. the kiosk's own
      // `attestKioskDevice` call) or legacy device — let it through.
      return true;
    }

    const header = req.headers[KioskAttestationGuard.SIGNATURE_HEADER];
    const value = Array.isArray(header) ? header[0] : header;
    if (!value) {
      throw new UnauthorizedException('Missing X-Device-Signature');
    }
    const parsed = parseHeader(value);
    if (!parsed) {
      throw new UnauthorizedException('Malformed X-Device-Signature');
    }

    const { iat, nonce, signature } = parsed;
    if (!isFresh(iat)) {
      throw new UnauthorizedException('Signature iat outside freshness window');
    }

    const accepted = await this.nonces.consume(user.sub, nonce);
    if (!accepted) {
      throw new UnauthorizedException('Replayed nonce');
    }

    const ok = await verifySignature({
      publicKeyPem: device.publicKey,
      signatureB64Url: signature,
      stringToSign: buildSigningString(req, iat, nonce),
    });
    if (!ok) {
      this.logger.warn(`Bad signature on kiosk request (userId=${user.sub})`);
      throw new UnauthorizedException('Bad device signature');
    }
    return true;
  }

  private getRequest(context: ExecutionContext): Request {
    if (context.getType<string>() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);
      const { req } = ctx.getContext<{ req: Request }>();
      return req;
    }
    return context.switchToHttp().getRequest<Request>();
  }
}

interface ParsedHeader {
  iat: string;
  nonce: string;
  signature: string;
}

function parseHeader(value: string): ParsedHeader | null {
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [iat, nonce, signature] = parts;
  if (!iat || !nonce || !signature) return null;
  return { iat, nonce, signature };
}

function isFresh(iat: string): boolean {
  const t = Number.parseInt(iat, 10);
  if (!Number.isFinite(t) || t <= 0) return false;
  return Math.abs(Date.now() - t) <= KioskAttestationGuard['IAT_SKEW_MS'];
}

function buildSigningString(req: Request, iat: string, nonce: string): string {
  const method = req.method.toUpperCase();
  const path = req.originalUrl.split('?')[0];
  const bodyHash = hashBody(req);
  return [method, path, bodyHash, iat, nonce].join('\n');
}

function hashBody(req: Request): string {
  const raw =
    (req as Request & { rawBody?: Buffer }).rawBody ??
    Buffer.from(req.body ? JSON.stringify(req.body as unknown) : '', 'utf-8');
  // Fast hash via Node crypto (sync); webcrypto.subtle is async-only.
  // We only need the hex digest as a stable input to the sign string.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('crypto') as typeof import('crypto');
  return createHash('sha256').update(raw).digest('hex');
}

async function verifySignature(args: {
  publicKeyPem: string;
  signatureB64Url: string;
  stringToSign: string;
}): Promise<boolean> {
  try {
    const spki = pemToDer(args.publicKeyPem);
    const key = await webcrypto.subtle.importKey(
      'spki',
      spki,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const sig = b64urlToBytes(args.signatureB64Url);
    const data = new TextEncoder().encode(args.stringToSign);
    return webcrypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      sig,
      data,
    );
  } catch {
    return false;
  }
}

function pemToDer(pem: string): Uint8Array {
  const trimmed = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  return Buffer.from(trimmed, 'base64');
}

function b64urlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}
