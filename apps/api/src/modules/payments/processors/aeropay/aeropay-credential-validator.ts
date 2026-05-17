import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

import { AeropayCredentials } from '../../onboarding/aeropay-onboarding.service';
import { ProcessorCredentialValidator } from '../../onboarding/processor-credential-validator';

interface AeropayConfigBaseUrls {
  readonly sandboxBaseUrl: string;
  readonly productionBaseUrl: string;
}

/**
 * Validates Aeropay merchant credentials by hitting a known-missing
 * transaction id with the supplied API key:
 *   - 401 / 403 → credentials are not authentic; throw.
 *   - 404       → request reached the API and was authenticated; the
 *                 resource just didn't exist. Healthy.
 *   - anything  → upstream sad (5xx / timeout / network). Throw with a
 *     else        "could not reach sandbox" message so the admin sees
 *                 the difference between "bad creds" and "Aeropay is
 *                 down right now".
 */
@Injectable()
export class AeropayCredentialValidator implements ProcessorCredentialValidator<AeropayCredentials> {
  private readonly logger = new Logger(AeropayCredentialValidator.name);
  private readonly urls: AeropayConfigBaseUrls;
  private readonly probeTransactionId: string;

  constructor(config: ConfigService) {
    this.urls = {
      sandboxBaseUrl:
        config.get<string>('AEROPAY_SANDBOX_BASE_URL') ??
        config.get<string>('AEROPAY_BASE_URL') ??
        '',
      productionBaseUrl: config.get<string>('AEROPAY_BASE_URL') ?? '',
    };
    this.probeTransactionId =
      config.get<string>('AEROPAY_PROBE_TRANSACTION_ID') ??
      'cannasaas-credential-probe';
  }

  async validate(args: {
    readonly credentials: AeropayCredentials;
    readonly isSandbox: boolean;
  }): Promise<void> {
    const baseUrl = args.isSandbox
      ? this.urls.sandboxBaseUrl
      : this.urls.productionBaseUrl;

    if (!baseUrl) {
      throw new Error(
        `Aeropay ${args.isSandbox ? 'sandbox' : 'production'} base URL is not configured`,
      );
    }

    const client: AxiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 8_000,
      headers: {
        Authorization: `Bearer ${args.credentials.apiKey}`,
      },
    });

    try {
      await client.get(`/v1/transactions/${this.probeTransactionId}`);
      // 2xx for a guaranteed-missing id is unusual but not failure-worthy.
      this.logger.log('Aeropay probe returned 2xx — credentials accepted');
    } catch (err: unknown) {
      if (isHealthy404(err)) return;
      throw classifyAxiosError(err, 'Aeropay');
    }
  }
}

function isHealthy404(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

function classifyAxiosError(err: unknown, processor: string): Error {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    if (status === 401 || status === 403) {
      return new Error(
        `${processor} sandbox returned ${status}; check the merchant id and API key`,
      );
    }
    if (status && status >= 500) {
      return new Error(
        `${processor} sandbox returned ${status}; try again in a moment`,
      );
    }
    return new Error(
      `Could not reach ${processor} sandbox: ${axiosErr.code ?? axiosErr.message}`,
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}
