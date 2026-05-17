import axios, { AxiosError, AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import {
  AeropayCreateTransactionRequest,
  AeropayRefund,
  AeropayRefundRequest,
  AeropayTransaction,
} from './aeropay.types';

export interface AeropayClientOptions {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly timeoutMs?: number;
}

/**
 * Thin typed wrapper around the Aeropay REST API. Lives one layer above
 * axios so the adapter can mock a typed surface in tests and so transient
 * 5xx retries / structured error shaping happen in exactly one place.
 */
export class AeropayClient {
  private readonly logger = new Logger(AeropayClient.name);
  private readonly http: AxiosInstance;

  constructor(options: AeropayClientOptions) {
    this.http = axios.create({
      baseURL: options.baseUrl,
      timeout: options.timeoutMs ?? 10_000,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createTransaction(
    body: AeropayCreateTransactionRequest,
  ): Promise<AeropayTransaction> {
    return this.post<AeropayTransaction>('/v1/transactions', body);
  }

  async getTransaction(id: string): Promise<AeropayTransaction> {
    return this.get<AeropayTransaction>(`/v1/transactions/${id}`);
  }

  async refundTransaction(
    id: string,
    body: AeropayRefundRequest,
  ): Promise<AeropayRefund> {
    return this.post<AeropayRefund>(`/v1/transactions/${id}/refund`, body);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    try {
      const response = await this.http.post<T>(path, body);
      return response.data;
    } catch (err) {
      throw this.wrap(err, `POST ${path}`);
    }
  }

  private async get<T>(path: string): Promise<T> {
    try {
      const response = await this.http.get<T>(path);
      return response.data;
    } catch (err) {
      throw this.wrap(err, `GET ${path}`);
    }
  }

  private wrap(err: unknown, label: string): Error {
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const status = axiosErr.response?.status ?? 0;
      const upstreamMessage =
        axiosErr.response?.data?.message ?? axiosErr.message;
      this.logger.warn(
        `Aeropay ${label} failed: status=${status} message=${upstreamMessage}`,
      );
      return new Error(
        `Aeropay ${label} failed (${status}): ${upstreamMessage}`,
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    this.logger.warn(`Aeropay ${label} threw a non-axios error: ${message}`);
    return new Error(`Aeropay ${label} failed: ${message}`);
  }
}
