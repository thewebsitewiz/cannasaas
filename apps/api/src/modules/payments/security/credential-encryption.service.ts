import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

/**
 * AES-256-GCM symmetric encryption for processor credentials at rest.
 *
 * Key source: `PAYMENTS_ENCRYPTION_KEY` env var, base64-encoded 32 bytes.
 * Output format: `base64(iv) . base64(authTag) . base64(ciphertext)` with
 * `.` separators. The auth tag is verified on decrypt; a tamper attempt
 * raises a generic error so callers don't leak format details.
 */
@Injectable()
export class CredentialEncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>('PAYMENTS_ENCRYPTION_KEY');
    if (!raw) {
      throw new InternalServerErrorException(
        'PAYMENTS_ENCRYPTION_KEY is not configured',
      );
    }
    const decoded = Buffer.from(raw, 'base64');
    if (decoded.length !== KEY_LENGTH_BYTES) {
      throw new InternalServerErrorException(
        `PAYMENTS_ENCRYPTION_KEY must decode to ${KEY_LENGTH_BYTES} bytes (got ${decoded.length})`,
      );
    }
    this.key = decoded;
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      ciphertext.toString('base64'),
    ].join('.');
  }

  decrypt(payload: string): string {
    const parts = payload.split('.');
    if (parts.length !== 3) {
      throw new Error('Encrypted credential payload is malformed');
    }
    const [ivB64, authTagB64, ciphertextB64] = parts as [
      string,
      string,
      string,
    ];
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    if (iv.length !== IV_LENGTH_BYTES) {
      throw new Error('Encrypted credential payload has wrong IV length');
    }
    if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new Error('Encrypted credential payload has wrong auth tag length');
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
