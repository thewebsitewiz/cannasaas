import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BiotrackCredential } from './entities/biotrack-credential.entity';
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
  private readonly logger = new Logger(BiotrackService.name);
  private encryptionKey: Buffer;

  constructor(
    @Inject(DRIZZLE) private db: any,
    private config: ConfigService
  ) {
    const keyStr = this.config.get<string>('ENCRYPTION_KEY', 'cannasaas-dev-key-change-in-prod-32b');
    const saltBytes = crypto.createHash('sha256').update(keyStr).digest().subarray(0, 16);
    this.encryptionKey = crypto.scryptSync(keyStr, saltBytes, 32);
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

    const [existing] = await this._q(
      `SELECT * FROM biotrack_credentials WHERE dispensary_id = $1 LIMIT 1`,
      [input.dispensaryId],
    );

    if (existing) {
      const [updated] = await this._q(
        `UPDATE biotrack_credentials SET api_key = $1, api_secret = COALESCE($2, api_secret), state = $3,
          license_number = COALESCE($4, license_number), is_active = true,
          validation_error = NULL, last_validated_at = NULL, updated_at = NOW()
         WHERE dispensary_id = $5 RETURNING *`,
        [encryptedApiKey, encryptedApiSecret ?? null, input.state, input.licenseNumber ?? null, input.dispensaryId],
      );
      return updated;
    } else {
      const [created] = await this._q(
        `INSERT INTO biotrack_credentials (dispensary_id, api_key, api_secret, state, license_number, is_active)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
        [input.dispensaryId, encryptedApiKey, encryptedApiSecret ?? null, input.state, input.licenseNumber ?? null],
      );
      return created;
    }
  }

  async getCredential(dispensaryId: string): Promise<BiotrackCredential | null> {
    return this._q(`SELECT * FROM biotrack_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`, [dispensaryId]).then(r => r[0] ?? null);
  }

  async validateCredential(dispensaryId: string): Promise<{ valid: boolean; message: string }> {
    const credential = await this._q(`SELECT * FROM biotrack_credentials WHERE dispensary_id = $1 LIMIT 1`, [dispensaryId]).then(r => r[0] ?? null);
    if (!credential) throw new NotFoundException('No BioTrack credential found for this dispensary');

    const baseUrl = BIOTRACK_BASE_URLS[credential.state];
    if (!baseUrl) return { valid: false, message: `Unsupported state: ${credential.state}` };

    try {
      // Stub: In production, this would make an actual API call to BioTrack
      // For now, validate that the credential exists and state is supported
      await this._q(
        `UPDATE biotrack_credentials SET last_validated_at = NOW(), validation_error = NULL WHERE credential_id = $1`,
        [credential.credentialId ?? credential.credential_id],
      );

      this.logger.log(`BioTrack credential validated for ${dispensaryId} (state: ${credential.state})`);
      return { valid: true, message: `BioTrack ${credential.state} credential validated (stub)` };
    } catch (err: any) {
      const message = err?.message ?? 'Validation error';
      await this._q(
        `UPDATE biotrack_credentials SET last_validated_at = NOW(), validation_error = $1 WHERE credential_id = $2`,
        [message.substring(0, 255), credential.credentialId ?? credential.credential_id],
      );
      return { valid: false, message };
    }
  }

  // ── Sync ────────────────────────────────────────────────────────────────

  async syncInventory(dispensaryId: string): Promise<{ success: boolean; message: string; itemCount: number }> {
    const credential = await this._q(`SELECT * FROM biotrack_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`, [dispensaryId]).then(r => r[0] ?? null);
    if (!credential) throw new NotFoundException('No active BioTrack credential');

    // Stub: In production, this would pull inventory from BioTrack API
    this.logger.log(`BioTrack inventory sync triggered for ${dispensaryId}`);
    return { success: true, message: 'Inventory sync queued (stub)', itemCount: 0 };
  }

  async reportSale(dispensaryId: string, orderId: string): Promise<{ success: boolean; message: string }> {
    const credential = await this._q(`SELECT * FROM biotrack_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`, [dispensaryId]).then(r => r[0] ?? null);
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
    const biotrack = await this._q(`SELECT * FROM biotrack_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`, [dispensaryId]).then(r => r[0] ?? null);
    if (biotrack) return 'biotrack';

    // Check Metrc
    const [metrc] = await this._q(
      `SELECT credential_id FROM metrc_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`,
      [dispensaryId],
    );
    if (metrc) return 'metrc';

    return 'none';
  }

  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
