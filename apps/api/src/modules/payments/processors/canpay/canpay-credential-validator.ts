import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

import { CanPayCredentials } from '../../onboarding/canpay-onboarding.service';
import { ProcessorCredentialValidator } from '../../onboarding/processor-credential-validator';

interface CanPayConfigBaseUrls {
  readonly sandboxBaseUrl: string;
  readonly productionBaseUrl: string;
}

/**
 * Mirrors AeropayCredentialValidator. Hits a known-missing transaction
 * id with the supplied API key; 401/403 → bad creds, 404 → healthy,
 * 5xx/network → upstream issue.
 */
@Injectable()
export class CanPayCredentialValidator implements ProcessorCredentialValidator<CanPayCredentials> {
  private readonly logger = new Logger(CanPayCredentialValidator.name);
  private readonly urls: CanPayConfigBaseUrls;
  private readonly probeTransactionId: string;

  constructor(config: ConfigService) {
    this.urls = {
      sandboxBaseUrl:
        config.get<string>('CANPAY_SANDBOX_BASE_URL') ??
        config.get<string>('CANPAY_BASE_URL') ??
        '',
      productionBaseUrl: config.get<string>('CANPAY_BASE_URL') ?? '',
    };
    this.probeTransactionId =
      config.get<string>('CANPAY_PROBE_TRANSACTION_ID') ??
      'cannasaas-credential-probe';
  }

  async validate(args: {
    readonly credentials: CanPayCredentials;
    readonly isSandbox: boolean;
  }): Promise<void> {
    const baseUrl = args.isSandbox
      ? this.urls.sandboxBaseUrl
      : this.urls.productionBaseUrl;

    if (!baseUrl) {
      throw new Error(
        `CanPay ${args.isSandbox ? 'sandbox' : 'production'} base URL is not configured`,
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
      this.logger.log('CanPay probe returned 2xx — credentials accepted');
    } catch (err: unknown) {
      if (isHealthy404(err)) return;
      throw classifyAxiosError(err, 'CanPay');
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
