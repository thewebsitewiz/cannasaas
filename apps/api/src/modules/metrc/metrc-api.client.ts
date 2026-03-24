import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { MetrcSyncLog } from './entities/metrc-sync-log.entity';
import { CircuitBreaker } from '../../common/services/circuit-breaker';

const STATE_BASE_URLS: Record<string, string> = {
  NY: 'https://api-ny.metrc.com',
  NJ: 'https://api-nj.metrc.com',
  CT: 'https://api-ct.metrc.com',
};

const SANDBOX_BASE_URL = 'https://sandbox-api-mn.metrc.com';

export interface MetrcApiResponse<T = any> {
  success: boolean;
  data?: T;
  status?: number;
  error?: string;
  syncLogId?: string;
}

@Injectable()
export class MetrcApiClient {
  private readonly logger = new Logger(MetrcApiClient.name);
  private readonly breaker = new CircuitBreaker({ name: 'metrc', failureThreshold: 3, resetTimeoutMs: 60000 });

  constructor(
    @InjectRepository(MetrcCredential)
    private credentialRepo: Repository<MetrcCredential>,
    @InjectRepository(MetrcSyncLog)
    private syncLogRepo: Repository<MetrcSyncLog>,
    private config: ConfigService,
  ) {}

  // ── Core API Caller ───────────────────────────────────────────────────────

  async callMetrc<T = any>(
    dispensaryId: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    opts?: {
      body?: any;
      syncType?: string;
      referenceEntityType?: string;
      referenceEntityId?: string;
    },
  ): Promise<MetrcApiResponse<T>> {
    const credential = await this.credentialRepo.findOne({
      where: { dispensaryId, isActive: true },
    });
    if (!credential) {
      return { success: false, error: 'No active Metrc credential for this dispensary' };
    }

    const isSandbox = this.config.get<boolean>('metrc.sandboxMode') ?? true;
    const baseUrl = isSandbox ? SANDBOX_BASE_URL : (STATE_BASE_URLS[credential.state] ?? STATE_BASE_URLS['NY']);
    const integratorKey = credential.integratorApiKey ?? this.config.get<string>('metrc.integratorApiKey');

    if (!integratorKey) {
      return { success: false, error: 'No integrator API key configured' };
    }

    const authToken = Buffer.from(`${credential.userApiKey}:${integratorKey}`).toString('base64');
    const url = `${baseUrl}${path}`;

    // Create sync log
    const syncLog = this.syncLogRepo.create({
      dispensaryId,
      credentialId: credential.credentialId,
      syncType: opts?.syncType ?? `${method} ${path}`,
      referenceEntityType: opts?.referenceEntityType,
      referenceEntityId: opts?.referenceEntityId,
      status: 'pending',
      attemptCount: 1,
    });
    await this.syncLogRepo.save(syncLog);

    try {
      const fetchOpts: RequestInit = {
        method,
        headers: {
          Authorization: `Basic ${authToken}`,
          'Content-Type': 'application/json',
        },
      };
      if (opts?.body && method !== 'GET') {
        fetchOpts.body = JSON.stringify(opts.body);
      }

      this.logger.log(`Metrc ${method} ${path} [${dispensaryId}]`);
      const { response, responseText } = await this.breaker.exec(async () => {
        const res = await fetch(url, fetchOpts);
        const text = await res.text();
        // Treat server errors as failures for the circuit breaker
        if (res.status >= 500) {
          throw new Error(`Metrc server error: HTTP ${res.status}`);
        }
        return { response: res, responseText: text };
      });

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      syncLog.metrcResponse = { status: response.status, body: typeof responseData === 'string' ? responseData.substring(0, 2000) : responseData };
      syncLog.status = response.ok ? 'success' : 'failed';

      if (!response.ok) {
        syncLog.errorMessage = `HTTP ${response.status}: ${typeof responseData === 'string' ? responseData.substring(0, 500) : JSON.stringify(responseData).substring(0, 500)}`;

        if (this.isRetryable(response.status)) {
          syncLog.nextRetryAt = this.getNextRetryTime(syncLog.attemptCount);
        }
      }

      await this.syncLogRepo.save(syncLog);

      return {
        success: response.ok,
        data: responseData,
        status: response.status,
        error: response.ok ? undefined : syncLog.errorMessage,
        syncLogId: syncLog.syncId,
      };
    } catch (err: any) {
      syncLog.status = 'failed';
      syncLog.errorMessage = err.message?.substring(0, 500) ?? 'Network error';
      syncLog.nextRetryAt = this.getNextRetryTime(syncLog.attemptCount);
      await this.syncLogRepo.save(syncLog);

      this.logger.error(`Metrc ${method} ${path} failed: ${err.message}`);
      return { success: false, error: err.message, syncLogId: syncLog.syncId };
    }
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  async reportSale(dispensaryId: string, receipt: any, orderId?: string) {
    return this.callMetrc(dispensaryId, 'POST', '/sales/v2/receipts', {
      body: [receipt],
      syncType: 'sale_receipt',
      referenceEntityType: 'order',
      referenceEntityId: orderId,
    });
  }

  async voidSale(dispensaryId: string, receiptId: number) {
    return this.callMetrc(dispensaryId, 'DELETE', `/sales/v2/receipts/${receiptId}`, {
      syncType: 'void_sale',
    });
  }

  // ── Packages ──────────────────────────────────────────────────────────────

  async getActivePackages(dispensaryId: string, licenseNumber: string) {
    return this.callMetrc<any[]>(dispensaryId, 'GET',
      `/packages/v2/active?licenseNumber=${encodeURIComponent(licenseNumber)}`, {
      syncType: 'get_active_packages',
    });
  }

  async adjustPackage(dispensaryId: string, adjustment: any) {
    return this.callMetrc(dispensaryId, 'PUT', '/packages/v2/adjust', {
      body: [adjustment],
      syncType: 'package_adjustment',
      referenceEntityType: 'package',
      referenceEntityId: adjustment.Label,
    });
  }

  // ── Transfers ─────────────────────────────────────────────────────────────

  async getIncomingTransfers(dispensaryId: string, licenseNumber: string) {
    return this.callMetrc<any[]>(dispensaryId, 'GET',
      `/transfers/v2/incoming?licenseNumber=${encodeURIComponent(licenseNumber)}`, {
      syncType: 'get_incoming_transfers',
    });
  }

  // ── Facilities ────────────────────────────────────────────────────────────

  async getFacilities(dispensaryId: string) {
    return this.callMetrc<any[]>(dispensaryId, 'GET', '/facilities/v2', {
      syncType: 'get_facilities',
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private getNextRetryTime(attemptCount: number): Date {
    const delayMs = Math.min(60_000 * Math.pow(2, attemptCount - 1), 3_600_000); // cap at 1hr
    return new Date(Date.now() + delayMs);
  }
}
