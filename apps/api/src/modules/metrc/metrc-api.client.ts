import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { MetrcSyncLog } from './entities/metrc-sync-log.entity';
import { CircuitBreaker } from '../../common/services/circuit-breaker';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

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
  private credentialRepo: any;
  private syncLogRepo: any;
  private readonly logger = new Logger(MetrcApiClient.name);
  private readonly breaker = new CircuitBreaker({ name: 'metrc', failureThreshold: 3, resetTimeoutMs: 60000 });

  constructor(

    private config: ConfigService
  ) {
    this.credentialRepo = this._makeRepo('metrc_credentials');
    this.syncLogRepo = this._makeRepo('metrc_sync_logs');
  }

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

  private _makeRepo(table: string) {
    const q = this._q.bind(this);
    return {
      async find(opts?: any): Promise<any[]> {
        let s = 'SELECT * FROM ' + table; const p: any[] = []; let i = 1;
        if (opts?.where) { const cd: string[] = []; for (const [k,v] of Object.entries(opts.where)) { if (v !== undefined) { cd.push(k+' = $'+i++); p.push(v); } } if (cd.length) s += ' WHERE ' + cd.join(' AND '); }
        if (opts?.order) { const sr = Object.entries(opts.order).map(([k,d]) => k+' '+d); if (sr.length) s += ' ORDER BY ' + sr.join(', '); }
        if (opts?.take) { s += ' LIMIT $'+i++; p.push(opts.take); }
        return q(s, p.length ? p : undefined);
      },
      async findOne(opts?: any): Promise<any> { const rows = await this.find({...opts, take: 1}); return rows[0] ?? null; },
      async findOneOrFail(opts?: any): Promise<any> { const r = await this.findOne(opts); if (!r) throw new Error('Entity not found'); return r; },
      create(data: any): any { return {...data}; },
      async save(entity: any): Promise<any> {
        const cols = Object.keys(entity).filter(k => entity[k] !== undefined);
        const vals = cols.map(k => entity[k]);
        const ph = cols.map((_,i) => '$'+(i+1));
        const [row] = await q('INSERT INTO '+table+' ('+cols.join(',')+') VALUES ('+ph.join(',')+') ON CONFLICT DO NOTHING RETURNING *', vals);
        return row ?? entity;
      },
      async update(criteria: any, values: any): Promise<any> {
        const sets: string[] = []; const p: any[] = []; let i = 1;
        for (const [k,v] of Object.entries(values)) { if (v !== undefined) { sets.push(k+' = $'+i++); p.push(v); } }
        if (!sets.length) return {affected:0};
        const cd: string[] = [];
        if (typeof criteria === 'string' || typeof criteria === 'number') { cd.push('id = $'+i++); p.push(criteria); }
        else { for (const [k,v] of Object.entries(criteria)) { cd.push(k+' = $'+i++); p.push(v); } }
        await q('UPDATE '+table+' SET '+sets.join(',')+' WHERE '+cd.join(' AND '), p);
        return {affected:1};
      },
      async delete(criteria: any): Promise<any> {
        const cd: string[] = []; const p: any[] = []; let i = 1;
        for (const [k,v] of Object.entries(criteria)) { cd.push(k+' = $'+i++); p.push(v); }
        await q('DELETE FROM '+table+(cd.length ? ' WHERE '+cd.join(' AND ') : ''), p);
        return {affected:1};
      },
      async count(opts?: any): Promise<number> {
        let s = 'SELECT COUNT(*)::int as count FROM '+table; const p: any[] = []; let i = 1;
        if (opts?.where) { const cd: string[] = []; for (const [k,v] of Object.entries(opts.where)) { if (v !== undefined) { cd.push(k+' = $'+i++); p.push(v); } } if (cd.length) s += ' WHERE ' + cd.join(' AND '); }
        const [r] = await q(s, p.length ? p : undefined); return r?.count ?? 0;
      },
      async remove(entity: any): Promise<void> { const keys = Object.keys(entity); await q('DELETE FROM '+table+' WHERE '+keys[0]+' = $1', [entity[keys[0]]]); },
      createQueryBuilder(alias: string) {
        let s = 'SELECT '+alias+'.* FROM '+table+' '+alias;
        const wheres: string[] = []; const p: any[] = []; let i = 1;
        const obs: string[] = []; let lim: number|undefined;
        return {
          where(cond: string, params?: any) { let c2=cond; if (params) for (const [k,v] of Object.entries(params)) { c2=c2.replace(':'+k,'$'+i++); p.push(v); } wheres.push(c2); return this; },
          andWhere(cond: string, params?: any) { return this.where(cond, params); },
          orderBy(col: string, dir: string) { obs.push(col+' '+dir); return this; },
          addOrderBy(col: string, dir: string) { obs.push(col+' '+dir); return this; },
          take(n: number) { lim=n; return this; },
          async getMany() { let full=s; if (wheres.length) full+=' WHERE '+wheres.join(' AND '); if (obs.length) full+=' ORDER BY '+obs.join(', '); if (lim) { full+=' LIMIT $'+i++; p.push(lim); } return q(full, p.length?p:undefined); },
        };
      },
    };
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
