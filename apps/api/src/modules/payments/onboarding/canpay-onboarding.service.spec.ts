import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from '../entities/dispensary-payment-processor.entity';
import { CredentialEncryptionService } from '../security/credential-encryption.service';
import { CanPayOnboardingService } from './canpay-onboarding.service';

type MockRepo = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('CanPayOnboardingService', () => {
  let service: CanPayOnboardingService;
  let repo: MockRepo;
  let encryption: Partial<CredentialEncryptionService>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto: Partial<DispensaryPaymentProcessor>) => ({
        ...dto,
      })),
      save: jest.fn((row: DispensaryPaymentProcessor) =>
        Promise.resolve({ ...row, id: row.id ?? 'gen' }),
      ),
    };
    encryption = {
      encrypt: jest.fn((plaintext: string) => `enc(${plaintext})`),
      decrypt: jest.fn((payload: string) =>
        payload.replace(/^enc\(/, '').replace(/\)$/, ''),
      ),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CanPayOnboardingService,
        {
          provide: getRepositoryToken(DispensaryPaymentProcessor),
          useValue: repo,
        },
        {
          provide: CredentialEncryptionService,
          useValue: encryption as CredentialEncryptionService,
        },
      ],
    }).compile();

    service = moduleRef.get(CanPayOnboardingService);
  });

  describe('provision', () => {
    it('rejects empty merchantId', async () => {
      await expect(
        service.provision({
          dispensaryId: 'd-1',
          merchantId: '   ',
          apiKey: 'k',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects empty apiKey', async () => {
      await expect(
        service.provision({
          dispensaryId: 'd-1',
          merchantId: 'm',
          apiKey: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a new row under processorName=canpay with encrypted credentials', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.provision({
        dispensaryId: 'd-1',
        merchantId: 'merch-42',
        apiKey: 'sk_test_xyz',
      });

      expect(encryption.encrypt).toHaveBeenCalledWith(
        JSON.stringify({ merchantId: 'merch-42', apiKey: 'sk_test_xyz' }),
      );
      const createCalls = repo.create.mock.calls as Array<
        [Partial<DispensaryPaymentProcessor>]
      >;
      expect(createCalls[0]?.[0]).toMatchObject({
        dispensaryId: 'd-1',
        processorName: DispensaryProcessorName.CANPAY,
        isEnabled: true,
        isSandbox: true,
        merchantExternalId: 'merch-42',
      });
      expect(createCalls[0]?.[0].credentialsEncrypted).toMatch(/^enc\(/);
      expect(result.isEnabled).toBe(true);
    });

    it('re-provisions an existing row, replacing the secret and bumping provisionedAt', async () => {
      const existing: Partial<DispensaryPaymentProcessor> = {
        id: 'row-1',
        dispensaryId: 'd-1',
        processorName: DispensaryProcessorName.CANPAY,
        isEnabled: false,
        isSandbox: true,
        credentialsEncrypted: 'enc(stale)',
        provisionedAt: new Date('2020-01-01'),
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.provision({
        dispensaryId: 'd-1',
        merchantId: 'merch-new',
        apiKey: 'sk_new',
        isSandbox: false,
      });

      expect(repo.create).not.toHaveBeenCalled();
      expect(result.isEnabled).toBe(true);
      expect(result.isSandbox).toBe(false);
      expect(result.credentialsEncrypted).toBe(
        'enc({"merchantId":"merch-new","apiKey":"sk_new"})',
      );
    });
  });

  describe('deprovision', () => {
    it('returns null when no row exists', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.deprovision('d-1');
      expect(result).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('disables the row and clears the secret', async () => {
      repo.findOne.mockResolvedValue({
        id: 'row-1',
        dispensaryId: 'd-1',
        processorName: DispensaryProcessorName.CANPAY,
        isEnabled: true,
        credentialsEncrypted: 'enc(secret)',
        provisionedAt: new Date('2026-01-01'),
      });

      const result = await service.deprovision('d-1');

      expect(result?.isEnabled).toBe(false);
      expect(result?.credentialsEncrypted).toBeUndefined();
      expect(result?.provisionedAt).toBeUndefined();
    });
  });

  describe('getCredentials', () => {
    it('returns null when the row is missing / disabled / has no secret', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      expect(await service.getCredentials('d-1')).toBeNull();
      repo.findOne.mockResolvedValueOnce({
        isEnabled: false,
        credentialsEncrypted: 'enc(x)',
      });
      expect(await service.getCredentials('d-1')).toBeNull();
      repo.findOne.mockResolvedValueOnce({
        isEnabled: true,
        credentialsEncrypted: undefined,
      });
      expect(await service.getCredentials('d-1')).toBeNull();
    });

    it('decrypts and returns the credentials JSON', async () => {
      repo.findOne.mockResolvedValue({
        isEnabled: true,
        credentialsEncrypted: 'enc({"merchantId":"m-1","apiKey":"k-1"})',
      });
      const result = await service.getCredentials('d-1');
      expect(result).toEqual({ merchantId: 'm-1', apiKey: 'k-1' });
    });
  });
});
