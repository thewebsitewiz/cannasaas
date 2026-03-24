import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { BiotrackCredential } from './entities/biotrack-credential.entity';

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
    @InjectRepository(BiotrackCredential)
    private credentialRepo: Repository<BiotrackCredential>,
    @InjectDataSource() private dataSource: DataSource,
    private config: ConfigService,
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

    const [order] = await this.dataSource.query(
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
    const [metrc] = await this.dataSource.query(
      `SELECT credential_id FROM metrc_credentials WHERE dispensary_id = $1 AND is_active = true LIMIT 1`,
      [dispensaryId],
    );
    if (metrc) return 'metrc';

    return 'none';
  }
}
