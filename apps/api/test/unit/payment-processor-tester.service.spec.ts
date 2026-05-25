/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
// test/ is outside the TS project (see apps/api/tsconfig.json "exclude":
// ["test"]) so Jest's globals lose their inferred types. Matches the
// existing convention of every other spec in test/unit/.

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
  DispensaryPaymentProcessor,
  DispensaryProcessorName,
} from '../../src/modules/payments/entities/dispensary-payment-processor.entity';
import { AeropayOnboardingService } from '../../src/modules/payments/onboarding/aeropay-onboarding.service';
import { CanPayOnboardingService } from '../../src/modules/payments/onboarding/canpay-onboarding.service';
import {
  AEROPAY_CREDENTIAL_VALIDATOR,
  CANPAY_CREDENTIAL_VALIDATOR,
} from '../../src/modules/payments/onboarding/processor-credential-validator';
import { PaymentProcessorTesterService } from '../../src/modules/payments/payment-processor-tester.service';

describe('PaymentProcessorTesterService', () => {
  let service: PaymentProcessorTesterService;
  let mockRepo: { findOne: jest.Mock };
  let mockAeropayOnboarding: { getCredentials: jest.Mock };
  let mockCanPayOnboarding: { getCredentials: jest.Mock };
  let mockAeropayValidator: { validate: jest.Mock } | null;
  let mockCanPayValidator: { validate: jest.Mock } | null;

  async function build(
    aeropayValidator: { validate: jest.Mock } | null = {
      validate: jest.fn().mockResolvedValue(undefined),
    },
    canpayValidator: { validate: jest.Mock } | null = {
      validate: jest.fn().mockResolvedValue(undefined),
    },
  ): Promise<void> {
    mockAeropayValidator = aeropayValidator;
    mockCanPayValidator = canpayValidator;
    mockRepo = { findOne: jest.fn() };
    mockAeropayOnboarding = {
      getCredentials: jest
        .fn()
        .mockResolvedValue({ merchantId: 'm-1', apiKey: 'k-1' }),
    };
    mockCanPayOnboarding = {
      getCredentials: jest
        .fn()
        .mockResolvedValue({ merchantId: 'm-2', apiKey: 'k-2' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProcessorTesterService,
        {
          provide: getRepositoryToken(DispensaryPaymentProcessor),
          useValue: mockRepo,
        },
        { provide: AeropayOnboardingService, useValue: mockAeropayOnboarding },
        { provide: CanPayOnboardingService, useValue: mockCanPayOnboarding },
        {
          provide: AEROPAY_CREDENTIAL_VALIDATOR,
          useValue: mockAeropayValidator,
        },
        { provide: CANPAY_CREDENTIAL_VALIDATOR, useValue: mockCanPayValidator },
      ],
    }).compile();
    service = module.get(PaymentProcessorTesterService);
  }

  it('throws BadRequest when no row exists for that processor', async () => {
    await build();
    mockRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      service.test('disp-1', DispensaryProcessorName.AEROPAY),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns ok:false when the row is disabled', async () => {
    await build();
    mockRepo.findOne.mockResolvedValueOnce({
      isEnabled: false,
      credentialsEncrypted: 'x',
      isSandbox: true,
    });
    const result = await service.test(
      'disp-1',
      DispensaryProcessorName.AEROPAY,
    );
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toMatch(/not provisioned/i);
    expect(mockAeropayValidator?.validate).not.toHaveBeenCalled();
  });

  it('returns ok:false when credentials cannot be decrypted', async () => {
    await build();
    mockRepo.findOne.mockResolvedValueOnce({
      isEnabled: true,
      credentialsEncrypted: 'x',
      isSandbox: true,
    });
    mockAeropayOnboarding.getCredentials.mockResolvedValueOnce(null);
    const result = await service.test(
      'disp-1',
      DispensaryProcessorName.AEROPAY,
    );
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toMatch(/stored credentials/i);
  });

  it('returns ok:false when the Aeropay adapter is not loaded', async () => {
    await build(null);
    mockRepo.findOne.mockResolvedValueOnce({
      isEnabled: true,
      credentialsEncrypted: 'x',
      isSandbox: true,
    });
    const result = await service.test(
      'disp-1',
      DispensaryProcessorName.AEROPAY,
    );
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toMatch(/not loaded/i);
  });

  it('returns ok:true with latencyMs on Aeropay happy path', async () => {
    const validator = { validate: jest.fn().mockResolvedValue(undefined) };
    await build(validator);
    mockRepo.findOne.mockResolvedValueOnce({
      isEnabled: true,
      credentialsEncrypted: 'x',
      isSandbox: true,
    });
    const result = await service.test(
      'disp-1',
      DispensaryProcessorName.AEROPAY,
    );
    expect(result.ok).toBe(true);
    expect(typeof result.latencyMs).toBe('number');
    expect(validator.validate).toHaveBeenCalledWith({
      credentials: { merchantId: 'm-1', apiKey: 'k-1' },
      isSandbox: true,
    });
  });

  it('returns ok:false with errorMessage when the validator throws', async () => {
    const validator = {
      validate: jest.fn().mockRejectedValue(new Error('401 bad key')),
    };
    await build(validator);
    mockRepo.findOne.mockResolvedValueOnce({
      isEnabled: true,
      credentialsEncrypted: 'x',
      isSandbox: false,
    });
    const result = await service.test(
      'disp-1',
      DispensaryProcessorName.AEROPAY,
    );
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBe('401 bad key');
    expect(result.latencyMs).toBeDefined();
  });

  it('routes CANPAY to the CanPay validator', async () => {
    const aeropayValidator = { validate: jest.fn() };
    const canpayValidator = {
      validate: jest.fn().mockResolvedValue(undefined),
    };
    await build(aeropayValidator, canpayValidator);
    mockRepo.findOne.mockResolvedValueOnce({
      isEnabled: true,
      credentialsEncrypted: 'x',
      isSandbox: true,
    });
    const result = await service.test('disp-1', DispensaryProcessorName.CANPAY);
    expect(result.ok).toBe(true);
    expect(canpayValidator.validate).toHaveBeenCalled();
    expect(aeropayValidator.validate).not.toHaveBeenCalled();
  });
});
