import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { AeropayCredentialValidator } from './aeropay-credential-validator';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeConfig(
  sandboxBaseUrl = 'https://sandbox.example/aeropay',
  productionBaseUrl = 'https://api.example/aeropay',
): ConfigService {
  return {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        AEROPAY_SANDBOX_BASE_URL: sandboxBaseUrl,
        AEROPAY_BASE_URL: productionBaseUrl,
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

describe('AeropayCredentialValidator', () => {
  let validator: AeropayCredentialValidator;
  let client: MockClient;

  beforeEach(() => {
    client = { get: jest.fn() };
    mockedAxios.create.mockReturnValue(
      client as unknown as ReturnType<typeof axios.create>,
    );
    mockedAxios.isAxiosError.mockImplementation(
      (v: unknown) => !!(v && (v as AxiosError).isAxiosError),
    );
    validator = new AeropayCredentialValidator(makeConfig());
  });

  it('passes when probe returns 404 (auth OK, resource missing)', async () => {
    client.get.mockRejectedValue(makeAxiosError(404));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('passes when probe returns 2xx (unusual but auth OK)', async () => {
    client.get.mockResolvedValue({ data: {} } as unknown as AxiosResponse);
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).resolves.toBeUndefined();
  });

  it('throws "check merchant id and API key" on 401', async () => {
    client.get.mockRejectedValue(makeAxiosError(401));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/check the merchant id and API key/);
  });

  it('throws "check merchant id and API key" on 403', async () => {
    client.get.mockRejectedValue(makeAxiosError(403));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/check the merchant id and API key/);
  });

  it('throws "try again" on 503', async () => {
    client.get.mockRejectedValue(makeAxiosError(503));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/try again in a moment/);
  });

  it('throws "Could not reach" on network error (no status)', async () => {
    client.get.mockRejectedValue(makeAxiosError(undefined, 'ECONNREFUSED'));
    await expect(
      validator.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/Could not reach Aeropay sandbox/);
  });

  it('throws when sandbox URL is missing', async () => {
    const empty = {
      get: jest.fn(() => undefined) as unknown as ConfigService['get'],
    } as ConfigService;
    const v = new AeropayCredentialValidator(empty);
    await expect(
      v.validate({
        credentials: { merchantId: 'm', apiKey: 'k' },
        isSandbox: true,
      }),
    ).rejects.toThrow(/base URL is not configured/);
  });
});
