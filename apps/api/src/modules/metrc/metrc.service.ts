import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { TagProductUidInput } from './dto/tag-product-uid.input';
import { TagPackageLabelInput } from './dto/tag-package-label.input';
import { SetMetrcCategoryInput } from './dto/set-metrc-category.input';
import { CredentialValidationResult } from './dto/credential-validation-result.type';
import { ComplianceReport, ComplianceIssue } from './dto/compliance-report.type';
import { CircuitBreaker } from '../../common/services/circuit-breaker';

const METRC_BASE_URLS: Record<string, string> = {
  NY: 'https://api-mn.metrc.com',
  NJ: 'https://api-nj.metrc.com',
  CT: 'https://api-ct.metrc.com',
};

@Injectable()
export class MetrcService {
  private encryptionKey: Buffer;
  private readonly breaker = new CircuitBreaker({ name: 'metrc', failureThreshold: 3, resetTimeoutMs: 60000 });

  constructor(
    @InjectRepository(MetrcCredential)
    private credentialRepo: Repository<MetrcCredential>,
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

  async upsertCredential(input: UpsertCredentialInput): Promise<MetrcCredential> {
    const encryptedUserApiKey = this.encrypt(input.userApiKey);
    const encryptedIntegratorApiKey = input.integratorApiKey ? this.encrypt(input.integratorApiKey) : undefined;

    let credential = await this.credentialRepo.findOne({ where: { dispensaryId: input.dispensaryId } });
    if (credential) {
      credential.userApiKey = encryptedUserApiKey;
      if (encryptedIntegratorApiKey) credential.integratorApiKey = encryptedIntegratorApiKey;
      credential.state = input.state;
      if (input.metrcUsername) credential.metrcUsername = input.metrcUsername;
      credential.isActive = true;
      credential.validationError = null as any;
      credential.lastValidatedAt = null as any;
    } else {
      credential = this.credentialRepo.create({
        dispensaryId: input.dispensaryId,
        userApiKey: encryptedUserApiKey,
        integratorApiKey: encryptedIntegratorApiKey,
        state: input.state,
        metrcUsername: input.metrcUsername,
        isActive: true,
      });
    }

    // Persist so validateCredential can look it up by dispensaryId
    credential = await this.credentialRepo.save(credential);

    // Validate credentials against the Metrc API before keeping them
    const validation = await this.validateCredential(input.dispensaryId);
    if (!validation.valid) {
      // Mark as inactive since validation failed
      credential.isActive = false;
      credential.validationError = validation.message as any;
      await this.credentialRepo.save(credential);
      throw new BadRequestException(
        `Metrc credential validation failed: ${validation.message}`,
      );
    }

    return credential;
  }

  async getCredential(dispensaryId: string): Promise<MetrcCredential | null> {
    return this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
  }

  async listCredentials(): Promise<MetrcCredential[]> {
    return this.credentialRepo.find({ order: { createdAt: 'DESC' } });
  }

  async deactivateCredential(dispensaryId: string): Promise<boolean> {
    const result = await this.credentialRepo.update({ dispensaryId }, { isActive: false });
    return (result.affected ?? 0) > 0;
  }

  async validateCredential(dispensaryId: string): Promise<CredentialValidationResult> {
    const credential = await this.credentialRepo.findOne({ where: { dispensaryId } });
    if (!credential) throw new NotFoundException('No Metrc credential found for this dispensary');

    const baseUrl = METRC_BASE_URLS[credential.state];
    if (!baseUrl) return { valid: false, message: `Unsupported state: ${credential.state}` };

    const integratorKey = credential.integratorApiKey ?? this.config.get<string>('metrc.integratorApiKey');
    if (!integratorKey) return { valid: false, message: 'No integrator API key configured' };

    const authToken = Buffer.from(`${credential.userApiKey}:${integratorKey}`).toString('base64');

    try {
      const isSandbox = this.config.get<boolean>('metrc.sandboxMode') ?? true;
      const url = isSandbox ? `https://sandbox-api-mn.metrc.com/facilities/v2` : `${baseUrl}/facilities/v2`;

      const response = await this.breaker.exec(() =>
        fetch(url, {
          headers: { Authorization: `Basic ${authToken}`, 'Content-Type': 'application/json' },
        }),
      );

      if (!response.ok) {
        const errorText = await response.text();
        await this.credentialRepo.update(credential.credentialId, {
          lastValidatedAt: new Date(),
          validationError: `HTTP ${response.status}: ${errorText.substring(0, 255)}`,
        });
        return { valid: false, message: `Metrc API error: HTTP ${response.status}` };
      }

      const facilities = await response.json() as any[];
      const facility = facilities?.[0];
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: null as any,
      });

      return {
        valid: true,
        message: `Connected to Metrc ${credential.state} — ${facilities.length} facility(ies) found`,
        metrcFacilityName: facility?.Name,
        licenseNumber: facility?.License?.Number,
        licenseType: facility?.License?.LicenseType,
      };
    } catch (err: any) {
      const message = err?.message ?? 'Network error';
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: message.substring(0, 255),
      });
      return { valid: false, message };
    }
  }

  // ── Product UID Tagging ───────────────────────────────────────────────────

  async tagProductUid(input: TagProductUidInput, dataSource: any): Promise<any> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      // Check for duplicate UID within dispensary
      const existing = await qr.query(
        `SELECT id FROM products WHERE metrc_item_uid = $1 AND dispensary_id = $2 AND id != $3`,
        [input.metrcItemUid, input.dispensaryId, input.productId]
      );
      if (existing.length > 0) {
        throw new ConflictException(`Metrc Item UID "${input.metrcItemUid}" already assigned to another product`);
      }

      await qr.query(
        `UPDATE products SET metrc_item_uid = $1, updated_at = NOW() WHERE id = $2 AND dispensary_id = $3`,
        [input.metrcItemUid, input.productId, input.dispensaryId]
      );

      const [product] = await qr.query(
        `SELECT id, name, metrc_item_uid, metrc_item_category_id FROM products WHERE id = $1`,
        [input.productId]
      );
      return product;
    } finally {
      await qr.release();
    }
  }

  // ── Package Label Tagging ─────────────────────────────────────────────────

  async tagPackageLabel(input: TagPackageLabelInput, dataSource: any): Promise<any> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      // Check for duplicate label within dispensary
      const existing = await qr.query(
        `SELECT variant_id FROM product_variants WHERE metrc_package_label = $1 AND dispensary_id = $2 AND variant_id != $3`,
        [input.metrcPackageLabel, input.dispensaryId, input.variantId]
      );
      if (existing.length > 0) {
        throw new ConflictException(`Package label "${input.metrcPackageLabel}" already assigned to another variant`);
      }

      await qr.query(
        `UPDATE product_variants SET metrc_package_label = $1, updated_at = NOW() WHERE variant_id = $2 AND dispensary_id = $3`,
        [input.metrcPackageLabel, input.variantId, input.dispensaryId]
      );

      const [variant] = await qr.query(
        `SELECT variant_id, name, metrc_package_label FROM product_variants WHERE variant_id = $1`,
        [input.variantId]
      );
      return variant;
    } finally {
      await qr.release();
    }
  }

  // ── Metrc Item Category ───────────────────────────────────────────────────

  async setMetrcCategory(input: SetMetrcCategoryInput, dataSource: any): Promise<any> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      // Validate category exists
      const [category] = await qr.query(
        `SELECT metrc_category_id, state, product_type_code FROM lkp_metrc_item_categories WHERE metrc_category_id = $1`,
        [input.metrcItemCategoryId]
      );
      if (!category) throw new NotFoundException(`Metrc item category ${input.metrcItemCategoryId} not found`);

      await qr.query(
        `UPDATE products SET metrc_item_category_id = $1, updated_at = NOW() WHERE id = $2 AND dispensary_id = $3`,
        [input.metrcItemCategoryId, input.productId, input.dispensaryId]
      );

      const [product] = await qr.query(
        `SELECT id, name, metrc_item_uid, metrc_item_category_id FROM products WHERE id = $1`,
        [input.productId]
      );
      return product;
    } finally {
      await qr.release();
    }
  }

  // ── Compliance Report ─────────────────────────────────────────────────────

  async generateComplianceReport(dispensaryId: string, dataSource: any): Promise<ComplianceReport> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const products = await qr.query(
        `SELECT 
          p.id, p.name, p.metrc_item_uid, p.metrc_item_category_id,
          p.product_type_id, p.thc_percent, p.is_approved,
          lpt.code as product_type_code,
          lmic.requires_unit_weight,
          COUNT(pv.variant_id) as variant_count,
          COUNT(pv.metrc_package_label) as labeled_variant_count
        FROM products p
        LEFT JOIN lkp_product_types lpt ON lpt.product_type_id = p.product_type_id
        LEFT JOIN lkp_metrc_item_categories lmic ON lmic.metrc_category_id = p.metrc_item_category_id
        LEFT JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
        WHERE p.dispensary_id = $1 AND p.is_active = true
        GROUP BY p.id, p.name, p.metrc_item_uid, p.metrc_item_category_id,
          p.product_type_id, p.thc_percent, p.is_approved, lpt.code, lmic.requires_unit_weight`,
        [dispensaryId]
      );

      const issues: ComplianceIssue[] = [];

      for (const p of products) {
        const productIssues: string[] = [];

        if (!p.metrc_item_uid) productIssues.push('Missing Metrc Item UID');
        if (!p.metrc_item_category_id) productIssues.push('Missing Metrc Item Category');
        if (!p.is_approved) productIssues.push('Product not approved');

        const variantCount = parseInt(p.variant_count, 10);
        const labeledCount = parseInt(p.labeled_variant_count, 10);
        if (variantCount > 0 && labeledCount < variantCount) {
          productIssues.push(`${variantCount - labeledCount} variant(s) missing Metrc package label`);
        }

        if (productIssues.length > 0) {
          issues.push({ productId: p.id, productName: p.name, issues: productIssues });
        }
      }

      const total = products.length;
      const nonCompliant = issues.length;
      const compliant = total - nonCompliant;

      return {
        dispensaryId,
        totalProducts: total,
        compliantProducts: compliant,
        nonCompliantProducts: nonCompliant,
        compliancePercent: total > 0 ? Math.round((compliant / total) * 100) : 100,
        issues,
        generatedAt: new Date(),
      };
    } finally {
      await qr.release();
    }
  }

  // ── Bulk UID Tagging ──────────────────────────────────────────────────────

  async bulkTagUids(input: any, dataSource: any): Promise<any> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    const results = [];

    for (const pair of input.pairs) {
      try {
        const existing = await qr.query(
          `SELECT id FROM products WHERE metrc_item_uid = $1 AND dispensary_id = $2 AND id != $3`,
          [pair.metrcItemUid, input.dispensaryId, pair.productId]
        );
        if (existing.length > 0) {
          results.push({ productId: pair.productId, productName: '', success: false, error: `UID already assigned to another product` });
          continue;
        }

        await qr.query(
          `UPDATE products SET metrc_item_uid = $1, updated_at = NOW() WHERE id = $2 AND dispensary_id = $3`,
          [pair.metrcItemUid, pair.productId, input.dispensaryId]
        );

        const [product] = await qr.query(`SELECT name FROM products WHERE id = $1`, [pair.productId]);
        results.push({ productId: pair.productId, productName: product?.name ?? '', success: true });
      } catch (err: any) {
        results.push({ productId: pair.productId, productName: '', success: false, error: err.message });
      }
    }

    await qr.release();
    return {
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  // ── Approve Product ───────────────────────────────────────────────────────

  async approveProduct(productId: string, dispensaryId: string, userId: string, dataSource: any): Promise<boolean> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const result = await qr.query(
        `UPDATE products SET is_approved = true, approved_by_user_id = $1, approved_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND dispensary_id = $3`,
        [userId, productId, dispensaryId]
      );
      return (result[1] ?? 0) > 0;
    } finally {
      await qr.release();
    }
  }


  // ── Metrc Sales Receipt Sync ──────────────────────────────────────────────

  async syncSaleToMetrc(orderId: string, dispensaryId: string, dataSource: any): Promise<any> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Get credential
      const credential = await this.credentialRepo.findOne({ where: { dispensaryId, isActive: true } });
      if (!credential) {
        return { success: false, message: 'No active Metrc credential for this dispensary' };
      }

      // Get order + line items
      const [order] = await qr.query(
        `SELECT o.*, d.state, d.license_number FROM orders o
         JOIN dispensaries d ON d.entity_id = o."dispensaryId"
         WHERE o."orderId" = $1 AND o."dispensaryId" = $2`,
        [orderId, dispensaryId]
      );
      if (!order) return { success: false, message: 'Order not found' };

      const lineItems = await qr.query(
        `SELECT li.*, p.name as product_name
         FROM order_line_items li
         JOIN products p ON p.id = li."productId"
         WHERE li."orderId" = $1`,
        [orderId]
      );

      // Build Metrc receipt payload
      const transactions = lineItems
        .filter((li: any) => li.metrcItemUid)
        .map((li: any) => ({
          PackageLabel: li.metrcPackageLabel ?? li.metrcItemUid,
          PackageState: order.state,
          Quantity: parseFloat(li.quantity),
          UnitOfMeasure: 'Each',
          TotalAmount: parseFloat(li.unitPrice) * parseFloat(li.quantity),
        }));

      if (transactions.length === 0) {
        await qr.query(
          `UPDATE orders SET "metrcSyncStatus" = 'skipped', "updatedAt" = NOW() WHERE "orderId" = $1`,
          [orderId]
        );
        return { success: false, message: 'No Metrc-tagged line items to sync' };
      }

      const payload = [{
        SalesDateTime: new Date(order.createdAt).toISOString(),
        SalesCustomerType: 'Consumer',
        PatientLicenseNumber: null,
        CaregiverLicenseNumber: null,
        IdentificationMethod: 'DL',
        Transactions: transactions,
      }];

      // Create sync log entry
      const [syncLog] = await qr.query(
        `INSERT INTO metrc_sync_logs (
          sync_id, dispensary_id, credential_id, sync_type,
          reference_entity_type, reference_entity_id, status,
          attempt_count, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'sale_receipt',
          'order', $3, 'pending', 1, NOW(), NOW()
        ) RETURNING sync_id`,
        [dispensaryId, credential.credentialId, orderId]
      );

      const integratorKey = credential.integratorApiKey ?? this.config.get<string>('metrc.integratorApiKey');
      const authToken = Buffer.from(`${credential.userApiKey}:${integratorKey}`).toString('base64');
      const isSandbox = this.config.get<boolean>('metrc.sandboxMode') ?? true;
      const baseUrl = isSandbox ? 'https://sandbox-api-mn.metrc.com' : `https://api-${order.state.toLowerCase()}.metrc.com`;

      const licenseNumber = order.license_number;
      const response = await this.breaker.exec(() =>
        fetch(`${baseUrl}/sales/v2/receipts?licenseNumber=${encodeURIComponent(licenseNumber)}`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }),
      );

      const responseText = await response.text();
      const success = response.ok;

      // Update sync log
      await qr.query(
        `UPDATE metrc_sync_logs SET
          status = $1, metrc_response = $2, updated_at = NOW()
         WHERE sync_id = $3`,
        [success ? 'success' : 'failed', JSON.stringify({ status: response.status, body: responseText.substring(0, 500) }), syncLog.sync_id]
      );

      // Update order metrc sync status
      await qr.query(
        `UPDATE orders SET "metrcSyncStatus" = $1, "metrcReportedAt" = $2, "updatedAt" = NOW()
         WHERE "orderId" = $3`,
        [success ? 'synced' : 'failed', success ? new Date() : null, orderId]
      );

      return {
        success,
        message: success ? `Sale reported to Metrc successfully` : `Metrc sync failed: HTTP ${response.status}`,
        syncLogId: syncLog.sync_id,
        metrcReceiptId: success ? `METRC-${orderId.substring(0, 8).toUpperCase()}` : undefined,
      };

    } catch (err: any) {
      return { success: false, message: err.message ?? 'Sync error' };
    } finally {
      await qr.release();
    }
  }


  async getFailedSyncDashboard(dispensaryId: string, dataSource: any): Promise<any> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const items = await qr.query(
        `SELECT
           o."orderId", o."orderStatus", o."metrcSyncStatus",
           o."metrcReportedAt", o.subtotal, o.total,
           to_char(o."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at_str,
           to_char(ml.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_sync_attempt,
           ml.metrc_response->>'body' as last_sync_error,
           ml.attempt_count
         FROM orders o
         LEFT JOIN LATERAL (
           SELECT updated_at, metrc_response, attempt_count
           FROM metrc_sync_logs
           WHERE reference_entity_id = o."orderId"::text
           ORDER BY created_at DESC
           LIMIT 1
         ) ml ON true
         WHERE o."dispensaryId" = $1
           AND o."metrcSyncStatus" IN ('failed', 'pending')
           AND o."orderStatus" = 'completed'
         ORDER BY o."createdAt" ASC`,
        [dispensaryId]
      );

      const oldest = items.length > 0 ? items[0].created_at_str : null;

      return {
        dispensaryId,
        totalFailed: items.length,
        oldestFailedAt: oldest ? (oldest instanceof Date ? oldest.toISOString() : oldest) : null,
        items: items.map((r: any) => ({
          orderId: r.orderId,
          orderStatus: r.orderStatus,
          metrcSyncStatus: r.metrcSyncStatus,
          metrcReportedAt: r.metrcReportedAt,
          subtotal: parseFloat(r.subtotal),
          total: parseFloat(r.total),
          createdAt: r.created_at_str ?? '',
          lastSyncAttempt: r.last_sync_attempt ?? null,
          lastSyncError: r.last_sync_error ? r.last_sync_error.substring(0, 200) : null,
          attemptCount: r.attempt_count ?? 0,
        })),
      };
    } finally {
      await qr.release();
    }
  }

}
