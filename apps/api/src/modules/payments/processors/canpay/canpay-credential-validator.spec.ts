import { vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { CanPayCredentialValidator } from './canpay-credential-validator';

vi.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeConfig(
  sandboxBaseUrl = 'https://sandbox.example/canpay',
  productionBaseUrl = 'https://api.example/canpay',
): ConfigService {
  return {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        CANPAY_SANDBOX_BASE_URL: sandboxBaseUrl,
        CANPAY_BASE_URL: productionBaseUrl,
      };
      return map[key];
    }) as unknown as ConfigService['get'],
  } as ConfigService;
}

interface MockClient {
  get: jest.Mock;
}

function makeAxiosError(status?: number, code?: string): AxiosError {
  const err = new Error(`status ${status ?? code ?? 'unknown'}`) as AxiosError;
  err.isAxiosError = true;
  err.code = code;
  if (status !== undefined) {
    err.response = { status } as AxiosResponse;
  }
  return err;
}

describe('CanPayCredentialValidator', () => {
  let validator: CanPayCredentialValidator;
  let client: MockClient;

  beforeEach(() => {
    client = { get: jest.fn() };
    mockedAxios.create.mockReturnValue(
      client as unknown as ReturnType<typeof axios.create>,
    );
    mockedAxios.isAxiosError.mockImplementation(
      (v: unknown) => !!(v && (v as AxiosError).isAxiosError),
    );
    validator = new CanPayCredentialValidator(makeConfig());
  });

  it('passes on 404 (auth OK)', async () => {
    client.get.mockRejectedValue(makeAxiosError(404));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('throws on 401', async () => {
    client.get.mockRejectedValue(makeAxiosError(401));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/check the merchant id and API key/);
  });

  it('throws on 500', async () => {
    client.get.mockRejectedValue(makeAxiosError(500));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/try again/);
  });

  it('throws on network error', async () => {
    client.get.mockRejectedValue(makeAxiosError(undefined, 'ETIMEDOUT'));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/Could not reach CanPay sandbox/);
  });
});
