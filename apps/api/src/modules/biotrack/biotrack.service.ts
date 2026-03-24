import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Inject, ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Inject, BiotrackCredential } from './entities/biotrack-credential.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

const BIOTRACK_STATES = ['WA', 'IL', 'NM', 'ND', 'HI', 'NJ'];

const BIOTRACK_BASE_URLS: Record<string, string> = {
  WA: 'https://wa.biotrackthc.com/api',
  IL: 'https://il.biotrackthc.com/api',
  NM: 'https://nm.biotrackthc.com/api',
  ND: 'https://nd.biotrackthc.com/api',
  HI: 'https://hi.biotrackthc.com/api',
  NJ: 'https://nj.biotrackthc.com/api',
};

@Injectable()
export class BiotrackService {
  private credentialRepo: any;
  private readonly logger = new Logger(BiotrackService.name);
  private encryptionKey: Buffer;

  constructor(
    @Inject(DRIZZLE) private db: any,
    private config: ConfigService
  ) {
    const keyStr = this.config.get<string>('ENCRYPTION_KEY', 'cannasaas-dev-key-change-in-prod-32b');
    const saltBytes = crypto.createHash('sha256').update(keyStr).digest().subarray(0, 16);
    this.encryptionKey = crypto.scryptSync(keyStr, saltBytes, 32);
  
    this.credentialRepo = this._makeRepo('metrc_credentials');
  }

  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // ── Credentials ──────────────────────────────────────────────────────────

  async upsertCredential(input: {
    dispensaryId: string;
    apiKey: string;
    apiSecret?: string;
    state: string;
    licenseNumber?: string;
  }): Promise<BiotrackCredential> {
    if (!BIOTRACK_STATES.includes(input.state)) {
      throw new BadRequestException(`BioTrack is not available in state: ${input.state}. Supported: ${BIOTRACK_STATES.join(', ')}`);
    }

    const encryptedApiKey = this.encrypt(input.apiKey);
    const encryptedApiSecret = input.apiSecret ? this.encrypt(input.apiSecret) : undefined;

    let credential = await this.credentialRepo.findOne({ where: { dispensaryId: input.dispensaryId } });
    if (credential) {
      credential.apiKey = encryptedApiKey;
      if (encryptedApiSecret) credential.apiSecret = encryptedApiSecret;
      credential.state = input.state;
      if (input.licenseNumber) credential.licenseNumber = input.licenseNumber;
      credential.isActive = true;
      credential.validationError = null as any;
      credential.lastValidatedAt = null as any;
    } else {
      credential = this.credentialRepo.create({
        dispensaryId: input.dispensaryId,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        state: input.state,
        licenseNumber: input.licenseNumber,
        isActive: true,
      });
    }

    return this.credentialRepo.save(credential);
  }

  async getCredential(dispensaryId: string): Promise<BiotrackCredential | null> {
    return this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
  }

  async validateCredential(dispensaryId: string): Promise<{ valid: boolean; message: string }> {
    const credential = await this.credentialRepo.findOne({ where: { dispensaryId } });
    if (!credential) throw new NotFoundException('No BioTrack credential found for this dispensary');

    const baseUrl = BIOTRACK_BASE_URLS[credential.state];
    if (!baseUrl) return { valid: false, message: `Unsupported state: ${credential.state}` };

    try {
      // Stub: In production, this would make an actual API call to BioTrack
      // For now, validate that the credential exists and state is supported
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: null as any,
      });

      this.logger.log(`BioTrack credential validated for ${dispensaryId} (state: ${credential.state})`);
      return { valid: true, message: `BioTrack ${credential.state} credential validated (stub)` };
    } catch (err: any) {
      const message = err?.message ?? 'Validation error';
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: message.substring(0, 255),
      });
      return { valid: false, message };
    }
  }

  // ── Sync ────────────────────────────────────────────────────────────────

  async syncInventory(dispensaryId: string): Promise<{ success: boolean; message: string; itemCount: number }> {
    const credential = await this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
    if (!credential) throw new NotFoundException('No active BioTrack credential');

    // Stub: In production, this would pull inventory from BioTrack API
    this.logger.log(`BioTrack inventory sync triggered for ${dispensaryId}`);
    return { success: true, message: 'Inventory sync queued (stub)', itemCount: 0 };
  }

  async reportSale(dispensaryId: string, orderId: string): Promise<{ success: boolean; message: string }> {
    const credential = await this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
    if (!credential) throw new NotFoundException('No active BioTrack credential');

    const [order] = await this._q(
      `SELECT "orderId", total, "orderStatus" FROM orders WHERE "orderId" = $1 AND "dispensaryId" = $2`,
      [orderId, dispensaryId],
    );
    if (!order) throw new NotFoundException('Order not found');

    // Stub: In production, this would push the sale to BioTrack
    this.logger.log(`BioTrack sale reported: order=${orderId} dispensary=${dispensaryId}`);
    return { success: true, message: `Sale ${orderId} reported to BioTrack (stub)` };
  }

  // ── Compliance System Detection ─────────────────────────────────────────

  async getComplianceSystem(dispensaryId: string): Promise<string> {
    // Check BioTrack first
    const biotrack = await this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
    if (biotrack) return 'biotrack';

    // Check Metrc
    const [metrc] = await this._q(
      `SELECT credential_id FROM metrc_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`,
      [dispensaryId],
    );
    if (metrc) return 'metrc';

    return 'none';
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
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
}
