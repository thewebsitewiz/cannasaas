import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { MetrcManifest, MetrcManifestItem, WasteDestructionLog, AuditLog, ReconciliationReport, ReconciliationItem } from './entities/compliance.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  private encryptionKey: Buffer;

  constructor(
    @Inject(DRIZZLE) private db: any,
    private config: ConfigService
  ) {
    const keyStr = this.config.get<string>('ENCRYPTION_KEY', 'cannasaas-dev-key-change-in-prod-32b');
    const saltBytes = crypto.createHash('sha256').update(keyStr).digest().subarray(0, 16);
    this.encryptionKey = crypto.scryptSync(keyStr, saltBytes, 32);
  }

  // ═══ ENCRYPTION ═══

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async encryptCredentials(dispensaryId: string): Promise<void> {
    const creds = await this._q(
      'SELECT credential_id, user_api_key, integrator_api_key, encryption_version FROM metrc_credentials WHERE dispensary_id = $1',
      [dispensaryId],
    );
    if (creds.length === 0 || creds[0].encryption_version >= 1) return;
    const cred = creds[0];
    const encUser = cred.user_api_key ? this.encrypt(cred.user_api_key) : null;
    const encInt = cred.integrator_api_key ? this.encrypt(cred.integrator_api_key) : null;
    await this._q(
      'UPDATE metrc_credentials SET user_api_key_encrypted = $1, integrator_api_key_encrypted = $2, user_api_key = $3, integrator_api_key = $4, encryption_version = 1, updated_at = NOW() WHERE credential_id = $5',
      [encUser, encInt, '***encrypted***', cred.integrator_api_key ? '***encrypted***' : null, cred.credential_id],
    );
    this.logger.log('Credentials encrypted for dispensary ' + dispensaryId);
  }

  async encryptAllCredentials(): Promise<number> {
    const creds = await this._q('SELECT dispensary_id FROM metrc_credentials WHERE encryption_version = 0 OR encryption_version IS NULL');
    for (const c of creds) { await this.encryptCredentials(c.dispensary_id); }
    return creds.length;
  }

  async getDecryptedApiKey(dispensaryId: string): Promise<{ userApiKey: string; integratorApiKey?: string }> {
    const creds = await this._q(
      'SELECT user_api_key, user_api_key_encrypted, integrator_api_key, integrator_api_key_encrypted, encryption_version FROM metrc_credentials WHERE dispensary_id = $1',
      [dispensaryId],
    );
    if (creds.length === 0) throw new NotFoundException('No credentials found');
    const cred = creds[0];
    if (cred.encryption_version >= 1 && cred.user_api_key_encrypted) {
      return { userApiKey: this.decrypt(cred.user_api_key_encrypted), integratorApiKey: cred.integrator_api_key_encrypted ? this.decrypt(cred.integrator_api_key_encrypted) : undefined };
    }
    return { userApiKey: cred.user_api_key, integratorApiKey: cred.integrator_api_key };
  }

  // ═══ MANIFESTS ═══

  async generateManifest(transferId: string, userId: string): Promise<any> {
    const transfers = await this._q(
      'SELECT it.*, df.name as from_name, df.license_number as from_license, dt.name as to_name, dt.license_number as to_license FROM inventory_transfers it JOIN dispensaries df ON df.entity_id = it.from_dispensary_id JOIN dispensaries dt ON dt.entity_id = it.to_dispensary_id WHERE it.transfer_id = $1',
      [transferId],
    );
    if (transfers.length === 0) throw new NotFoundException('Transfer not found');
    const t = transfers[0];
    const manifestNumber = 'MFT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const items = await this._q('SELECT * FROM inventory_transfer_items WHERE transfer_id = $1', [transferId]);
    const totalQty = items.reduce((s: number, i: any) => s + (i.quantity_requested || 0), 0);

    const manifest = this.manifestRepo.create({
      transfer_id: transferId,
      dispensary_id: t.from_dispensary_id,
      manifest_number: manifestNumber,
      from_license: t.from_license || 'N/A',
      to_license: t.to_license || 'N/A',
      from_facility_name: t.from_name,
      to_facility_name: t.to_name,
      total_packages: items.length,
      total_quantity: totalQty,
      status: 'draft',
    });
    const saved = await this.manifestRepo.save(manifest);

    for (const item of items) {
      const mi = this.manifestItemRepo.create({
        manifest_id: (saved as any).manifestId,
        variant_id: item.variant_id,
        product_name: item.product_name,
        quantity: item.quantity_requested,
        metrc_package_tag: item.metrc_package_tag,
      });
      await this.manifestItemRepo.save(mi);
    }

    await this.logAudit(t.from_dispensary_id, userId, 'create', 'manifest', (saved as any).manifestId, { transferId, manifestNumber });
    this.logger.log('Manifest generated: ' + manifestNumber);
    return saved;
  }

  async getManifests(dispensaryId: string, status?: string): Promise<MetrcManifest[]> {
    const where: any = { dispensary_id: dispensaryId };
    if (status) where.status = status;
    return this.manifestRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async getManifestItems(manifestId: string): Promise<MetrcManifestItem[]> {
    return this.manifestItemRepo.find({ where: { manifest_id: manifestId } });
  }

  async updateManifestStatus(manifestId: string, status: string, userId: string): Promise<MetrcManifest> {
    const manifest = await this.manifestRepo.findOne({ where: { manifestId } });
    if (!manifest) throw new NotFoundException('Manifest not found');
    manifest.status = status;
    await this.logAudit(null, userId, 'update', 'manifest', manifestId, { status });
    return this.manifestRepo.save(manifest);
  }

  // ═══ WASTE/DESTRUCTION ═══

  async logWaste(input: {
    dispensaryId: string; productName: string; variantId?: string;
    quantity: number; unitOfMeasure: string; wasteType: string;
    destructionMethod?: string; reason: string;
    witness1Name: string; witness1Title?: string;
    witness2Name?: string; witness2Title?: string;
    photoUrls?: string[]; submittedByUserId: string; notes?: string;
  }): Promise<WasteDestructionLog> {
    const log = this.wasteRepo.create({
      dispensary_id: input.dispensaryId,
      variant_id: input.variantId,
      product_name: input.productName,
      quantity: input.quantity,
      unit_of_measure: input.unitOfMeasure,
      waste_type: input.wasteType,
      destruction_method: input.destructionMethod,
      reason: input.reason,
      witness1_name: input.witness1Name,
      witness1_title: input.witness1Title,
      witness2_name: input.witness2Name,
      witness2_title: input.witness2Title,
      submitted_by_user_id: input.submittedByUserId,
      notes: input.notes,
      status: 'pending',
      destroyed_at: new Date(),
    });
    const saved = await this.wasteRepo.save(log);
    await this.logAudit(input.dispensaryId, input.submittedByUserId, 'create', 'waste_log', (saved as any).logId, { productName: input.productName, quantity: input.quantity });

    if (input.variantId) {
      await this._q('UPDATE inventory SET quantity_on_hand = GREATEST(0, quantity_on_hand - $1), quantity_available = GREATEST(0, quantity_available - $1), updated_at = NOW() WHERE variant_id = $2 AND dispensary_id = $3', [input.quantity, input.variantId, input.dispensaryId]);
    }
    return saved as WasteDestructionLog;
  }

  async approveWaste(logId: string, userId: string): Promise<WasteDestructionLog> {
    const log = await this.wasteRepo.findOne({ where: { logId } });
    if (!log) throw new NotFoundException('Waste log not found');
    log.status = 'completed';
    await this.logAudit(null, userId, 'approve', 'waste_log', logId, {});
    return this.wasteRepo.save(log);
  }

  async getWasteLogs(dispensaryId: string, limit = 50): Promise<WasteDestructionLog[]> {
    return this.wasteRepo.find({
      where: { dispensary_id: dispensaryId },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async getWasteTypes(): Promise<any[]> {
    return this._q('SELECT * FROM lkp_waste_types WHERE is_active = true ORDER BY waste_type_id');
  }

  // ═══ AUDIT LOGGING ═══

  async logAudit(dispensaryId: string | null, userId: string | null, action: string, entityType: string, entityId: string, changes: any, ipAddress?: string): Promise<void> {
    let email: string | undefined;
    if (userId) {
      const users = await this._q('SELECT email FROM users WHERE id = $1', [userId]);
      email = users[0]?.email;
    }
    const entry = this.auditRepo.create({
      dispensary_id: dispensaryId ?? undefined,
      user_id: userId ?? undefined,
      user_email: email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes ? JSON.stringify(changes) : undefined,
      ip_address: ipAddress,
    });
    await this.auditRepo.save(entry);
  }

  async getAuditLog(dispensaryId: string, limit = 100, entityType?: string, action?: string): Promise<AuditLog[]> {
    const qb = this.auditRepo.createQueryBuilder('a')
      .where('a.dispensary_id = :dispensaryId', { dispensaryId });
    if (entityType) qb.andWhere('a.entity_type = :entityType', { entityType });
    if (action) qb.andWhere('a.action = :action', { action });
    return qb.orderBy('a.created_at', 'DESC').take(limit).getMany();
  }

  async getEntityAuditTrail(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { entity_type: entityType, entity_id: entityId },
      order: { created_at: 'ASC' },
    });
  }

  // ═══ RECONCILIATION ═══

  async runReconciliation(dispensaryId: string, userId: string): Promise<ReconciliationReport> {
    const today = new Date().toISOString().split('T')[0];

    // Delete existing report for today
    await this._q('DELETE FROM reconciliation_items WHERE report_id IN (SELECT report_id FROM reconciliation_reports WHERE dispensary_id = $1 AND report_date = $2)', [dispensaryId, today]);
    await this._q('DELETE FROM reconciliation_reports WHERE dispensary_id = $1 AND report_date = $2', [dispensaryId, today]);

    const localItems = await this._q(
      'SELECT i.variant_id, i.quantity_on_hand, p.name as product_name, pv.metrc_package_label FROM inventory i JOIN product_variants pv ON pv.variant_id = i.variant_id JOIN products p ON p.id = pv.product_id WHERE i.dispensary_id = $1',
      [dispensaryId],
    );

    const metrcProducts = await this._q(
      'SELECT p.metrc_item_uid, p.name, SUM(i.quantity_on_hand) as expected_qty FROM products p JOIN product_variants pv ON pv.product_id = p.id JOIN inventory i ON i.variant_id = pv.variant_id WHERE p.dispensary_id = $1 AND p.metrc_item_uid IS NOT NULL GROUP BY p.metrc_item_uid, p.name',
      [dispensaryId],
    );

    const metrcMap = new Map<string, any>(metrcProducts.map((m: any) => [m.metrc_item_uid, m]));

    const report = this.reconRepo.create({
      dispensary_id: dispensaryId,
      report_date: today,
      status: 'running',
      total_local_items: localItems.length,
      total_metrc_items: metrcProducts.length,
    });
    const savedReport = await this.reconRepo.save(report) as ReconciliationReport;
    const reportId = savedReport.reportId;

    let matched = 0;
    let discrepancies = 0;
    let localOnly = 0;
    const seen = new Set<string>();

    for (const local of localItems) {
      const productMetrc = await this._q(
        'SELECT p.metrc_item_uid FROM products p JOIN product_variants pv ON pv.product_id = p.id WHERE pv.variant_id = $1',
        [local.variant_id],
      );
      const uid = productMetrc[0]?.metrc_item_uid;
      const qty = Math.round(parseFloat(local.quantity_on_hand) || 0);

      if (uid && metrcMap.has(uid)) {
        seen.add(uid);
        matched++;
        const item = this.reconItemRepo.create({
          report_id: reportId,
          variant_id: local.variant_id,
          product_name: local.product_name,
          metrc_package_tag: uid,
          local_quantity: qty,
          metrc_quantity: qty,
          variance: 0,
          status: "matched",
        } as any);
        await this.reconItemRepo.save(item);
      } else {
        localOnly++;
        discrepancies++;
        const item = this.reconItemRepo.create({
          report_id: reportId,
          variant_id: local.variant_id,
          product_name: local.product_name,
          local_quantity: qty,
          status: 'local_only',
        } as any);
        await this.reconItemRepo.save(item);
      }
    }

    savedReport.status = 'completed';
    savedReport.matched_items = matched;
    savedReport.discrepancy_count = discrepancies;
    const final = await this.reconRepo.save(savedReport);

    await this.logAudit(dispensaryId, userId, 'create', 'reconciliation', reportId, { matched, discrepancies, localOnly });
    this.logger.log('Reconciliation: ' + matched + ' matched, ' + discrepancies + ' discrepancies');

    return final;
  }

  async getReconciliationReports(dispensaryId: string, limit = 10): Promise<ReconciliationReport[]> {
    return this.reconRepo.find({
      where: { dispensary_id: dispensaryId },
      order: { report_date: 'DESC' },
      take: limit,
    });
  }

  async getReconciliationItems(reportId: string, statusFilter?: string): Promise<ReconciliationItem[]> {
    const where: any = { report_id: reportId };
    if (statusFilter) where.status = statusFilter;
    return this.reconItemRepo.find({ where, order: { product_name: 'ASC' } });
  }

  @Cron('0 6 * * *')
  async dailyReconciliation(): Promise<void> {
    this.logger.log('Running daily reconciliation...');
    const dispensaries = await this._q('SELECT entity_id FROM dispensaries WHERE is_active = true');
    for (const d of dispensaries) {
      try { await this.runReconciliation(d.entity_id, 'system'); }
      catch (err: any) { this.logger.error('Reconciliation failed for ' + d.entity_id + ': ' + err.message); }
    }
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
