import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

import { CredentialEncryptionService } from './credential-encryption.service';

function freshKey(): string {
  return randomBytes(32).toString('base64');
}

async function buildService(
  key: string | undefined = freshKey(),
): Promise<CredentialEncryptionService> {
  const config: Partial<ConfigService> = {
    get: jest.fn((name: string) =>
      name === 'PAYMENTS_ENCRYPTION_KEY' ? key : undefined,
    ) as unknown as ConfigService['get'],
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      CredentialEncryptionService,
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return moduleRef.get(CredentialEncryptionService);
}

describe('CredentialEncryptionService', () => {
  it('round-trips a credential blob unchanged', async () => {
    const service = await buildService();
    const plaintext = JSON.stringify({
      merchantId: 'm-1',
      apiKey: 'sk_test_abc',
    });
    const encrypted = service.encrypt(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(service.decrypt(encrypted)).toBe(plaintext);
  });

  it('produces a different ciphertext on each call (random IV)', async () => {
    const service = await buildService();
    const a = service.encrypt('hello');
    const b = service.encrypt('hello');
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe('hello');
    expect(service.decrypt(b)).toBe('hello');
  });

  it('rejects tampering with the ciphertext (auth tag mismatch)', async () => {
    const service = await buildService();
    const encrypted = service.encrypt('hello');
    const parts = encrypted.split('.');
    parts[2] = Buffer.from('tampered-payload').toString('base64');
    const tampered = parts.join('.');
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('rejects a malformed payload (wrong number of parts)', async () => {
    const service = await buildService();
    expect(() => service.decrypt('only.two')).toThrow(/malformed/);
  });

  it('throws on construction when the key is missing', () => {
    const config = {
      get: jest.fn(() => undefined),
    } as unknown as ConfigService;
    expect(() => new CredentialEncryptionService(config)).toThrow(
      /not configured/,
    );
  });

  it('throws on construction when the key has wrong length', () => {
    const shortKey = Buffer.from('short').toString('base64');
    const config = {
      get: jest.fn(() => shortKey),
    } as unknown as ConfigService;
    expect(() => new CredentialEncryptionService(config)).toThrow(/32 bytes/);
  });
});
