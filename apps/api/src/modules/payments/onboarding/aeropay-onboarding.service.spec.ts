import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from '../entities/dispensary-payment-processor.entity';
import { CredentialEncryptionService } from '../security/credential-encryption.service';
import { AeropayOnboardingService } from './aeropay-onboarding.service';
import {
  AEROPAY_CREDENTIAL_VALIDATOR,
  ProcessorCredentialValidationError,
} from './processor-credential-validator';

type MockRepo = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('AeropayOnboardingService', () => {
  let service: AeropayOnboardingService;
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
        AeropayOnboardingService,
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

    service = moduleRef.get(AeropayOnboardingService);
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

    it('creates a new row with encrypted credentials and enables Aeropay', async () => {
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
        processorName: DispensaryProcessorName.AEROPAY,
        isEnabled: true,
        isSandbox: true,
        merchantExternalId: 'merch-42',
      });
      expect(createCalls[0]?.[0].credentialsEncrypted).toMatch(/^enc\(/);
      expect(result.isEnabled).toBe(true);
      expect(result.merchantExternalId).toBe('merch-42');
    });

    it('re-provisions an existing row, replacing the secret and bumping provisionedAt', async () => {
      const existing: Partial<DispensaryPaymentProcessor> = {
        id: 'row-1',
        dispensaryId: 'd-1',
        processorName: DispensaryProcessorName.AEROPAY,
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
      expect(result.merchantExternalId).toBe('merch-new');
      expect(result.provisionedAt).not.toEqual(new Date('2020-01-01'));
    });

    it('trims whitespace from inputs before encrypting', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.provision({
        dispensaryId: 'd-1',
        merchantId: '  merch  ',
        apiKey: '  sk  ',
      });
      expect(encryption.encrypt).toHaveBeenCalledWith(
        JSON.stringify({ merchantId: 'merch', apiKey: 'sk' }),
      );
    });

    it('persists credentials unvalidated (with a warning) when no validator is registered', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.provision({
        dispensaryId: 'd-1',
        merchantId: 'merch',
        apiKey: 'sk',
      });
      expect(result.isEnabled).toBe(true);
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('provision with a registered validator', () => {
    let validatorService: AeropayOnboardingService;
    const validate = jest.fn();

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          AeropayOnboardingService,
          {
            provide: getRepositoryToken(DispensaryPaymentProcessor),
            useValue: repo,
          },
          {
            provide: CredentialEncryptionService,
            useValue: encryption as CredentialEncryptionService,
          },
          {
            provide: AEROPAY_CREDENTIAL_VALIDATOR,
            useValue: { validate },
          },
        ],
      }).compile();
      validatorService = moduleRef.get(AeropayOnboardingService);
      validate.mockReset();
    });

    it('forwards credentials + sandbox flag to the validator', async () => {
      repo.findOne.mockResolvedValue(null);
      validate.mockResolvedValue(undefined);
      await validatorService.provision({
        dispensaryId: 'd-1',
        merchantId: 'merch',
        apiKey: 'sk',
        isSandbox: false,
      });
      expect(validate).toHaveBeenCalledWith({
        credentials: { merchantId: 'merch', apiKey: 'sk' },
        isSandbox: false,
      });
    });

    it('wraps a validator failure in ProcessorCredentialValidationError and does not persist', async () => {
      repo.findOne.mockResolvedValue(null);
      validate.mockRejectedValue(new Error('401 Unauthorized'));
      await expect(
        validatorService.provision({
          dispensaryId: 'd-1',
          merchantId: 'merch',
          apiKey: 'sk',
        }),
      ).rejects.toThrow(ProcessorCredentialValidationError);
      expect(repo.save).not.toHaveBeenCalled();
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
      const existing: Partial<DispensaryPaymentProcessor> = {
        id: 'row-1',
        dispensaryId: 'd-1',
        processorName: DispensaryProcessorName.AEROPAY,
        isEnabled: true,
        isSandbox: false,
        credentialsEncrypted: 'enc(secret)',
        provisionedAt: new Date('2026-01-01'),
      };
      repo.findOne.mockResolvedValue(existing);

      const result = await service.deprovision('d-1');

      expect(result?.isEnabled).toBe(false);
      expect(result?.credentialsEncrypted).toBeUndefined();
      expect(result?.provisionedAt).toBeUndefined();
    });
  });

  describe('getCredentials', () => {
    it('returns null when the row is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      expect(await service.getCredentials('d-1')).toBeNull();
    });

    it('returns null when the row is disabled', async () => {
      repo.findOne.mockResolvedValue({
        isEnabled: false,
        credentialsEncrypted: 'enc({"merchantId":"m","apiKey":"k"})',
      });
      expect(await service.getCredentials('d-1')).toBeNull();
    });

    it('returns null when no credentials are stored', async () => {
      repo.findOne.mockResolvedValue({
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
