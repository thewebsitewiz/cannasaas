import axios, { AxiosError, AxiosInstance } from 'axios';
import { Logger } from '@nestjs/common';
import {
  CanPayCreateTransactionRequest,
  CanPayRefund,
  CanPayRefundRequest,
  CanPayTransaction,
} from './canpay.types';

export interface CanPayClientOptions {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly timeoutMs?: number;
}

export class CanPayClient {
  private readonly logger = new Logger(CanPayClient.name);
  private readonly http: AxiosInstance;

  constructor(options: CanPayClientOptions) {
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
    body: CanPayCreateTransactionRequest,
  ): Promise<CanPayTransaction> {
    return this.post<CanPayTransaction>('/v1/transactions', body);
  }

  async getTransaction(id: string): Promise<CanPayTransaction> {
    return this.get<CanPayTransaction>(`/v1/transactions/${id}`);
  }

  async refundTransaction(
    id: string,
    body: CanPayRefundRequest,
  ): Promise<CanPayRefund> {
    return this.post<CanPayRefund>(`/v1/transactions/${id}/refund`, body);
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
        `CanPay ${label} failed: status=${status} message=${upstreamMessage}`,
      );
      return new Error(
        `CanPay ${label} failed (${status}): ${upstreamMessage}`,
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    this.logger.warn(`CanPay ${label} threw a non-axios error: ${message}`);
    return new Error(`CanPay ${label} failed: ${message}`);
  }
}
