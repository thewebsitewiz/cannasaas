import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { TagProductUidInput } from './dto/tag-product-uid.input';
import { TagPackageLabelInput } from './dto/tag-package-label.input';
import { SetMetrcCategoryInput } from './dto/set-metrc-category.input';
import { BulkTagUidInput } from './dto/bulk-tag-uid.input';
import { CredentialValidationResult } from './dto/credential-validation-result.type';
import {
  ComplianceReport,
  ComplianceIssue,
} from './dto/compliance-report.type';
import { CircuitBreaker } from '../../common/services/circuit-breaker';

const METRC_BASE_URLS: Record<string, string> = {
  NY: 'https://api-mn.metrc.com',
  NJ: 'https://api-nj.metrc.com',
  CT: 'https://api-ct.metrc.com',
};

interface MetrcFacilityLicense {
  Number?: string;
  LicenseType?: string;
}

interface MetrcFacility {
  Name?: string;
  License?: MetrcFacilityLicense;
}

interface IdRow {
  id: string;
}

interface VariantIdRow {
  variant_id: string;
}

interface ProductRow {
  id: string;
  name: string;
  metrc_item_uid?: string | null;
  metrc_item_category_id?: number | null;
}

interface VariantRow {
  variant_id: string;
  name: string;
  metrc_package_label?: string | null;
}

interface CategoryRow {
  metrc_category_id: number;
  state: string;
  product_type_code: string;
}

interface ComplianceProductRow {
  id: string;
  name: string;
  metrc_item_uid: string | null;
  metrc_item_category_id: number | null;
  product_type_id: string | null;
  thc_percent: string | number | null;
  is_approved: boolean | null;
  product_type_code: string | null;
  requires_unit_weight: boolean | null;
  variant_count: string | number;
  labeled_variant_count: string | number;
}

interface ProductNameRow {
  name: string;
}

interface OrderRow {
  orderId: string;
  state: string;
  license_number: string;
  createdAt: Date | string;
}

interface LineItemRow {
  metrcItemUid?: string | null;
  metrcPackageLabel?: string | null;
  quantity: string | number;
  unitPrice: string | number;
}

interface SyncLogIdRow {
  sync_id: string;
}

interface FailedSyncRow {
  orderId: string;
  orderStatus: string;
  metrcSyncStatus: string;
  metrcReportedAt: Date | string | null;
  subtotal: string | number;
  total: string | number;
  created_at_str: string | null;
  last_sync_attempt: string | null;
  last_sync_error: string | null;
  attempt_count: number | null;
}

export interface BulkTagItemResult {
  productId: string;
  productName: string;
  success: boolean;
  error?: string;
}

export interface BulkTagUidsResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BulkTagItemResult[];
}

export interface SyncSaleResult {
  success: boolean;
  message?: string;
  syncLogId?: string;
  metrcReceiptId?: string;
}

export interface FailedSyncItem {
  orderId: string;
  orderStatus: string;
  metrcSyncStatus: string;
  metrcReportedAt: Date | string | null;
  subtotal: number;
  total: number;
  createdAt: string;
  lastSyncAttempt: string | null;
  lastSyncError: string | null;
  attemptCount: number;
}

export interface FailedSyncDashboard {
  dispensaryId: string;
  totalFailed: number;
  oldestFailedAt: string | null;
  items: FailedSyncItem[];
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function runnerQuery<T>(
  qr: QueryRunner,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await qr.query(sql, params)) as unknown;
  return rows as T[];
}

function runnerExec(
  qr: QueryRunner,
  sql: string,
  params?: unknown[],
): Promise<unknown> {
  return qr.query(sql, params) as Promise<unknown>;
}

function toNumber(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class MetrcService {
  private encryptionKey: Buffer;
  private readonly breaker = new CircuitBreaker({
    name: 'metrc',
    failureThreshold: 3,
    resetTimeoutMs: 60000,
  });

  constructor(
    @InjectRepository(MetrcCredential)
    private credentialRepo: Repository<MetrcCredential>,
    private config: ConfigService,
  ) {
    const keyStr = this.config.get<string>(
      'ENCRYPTION_KEY',
      'cannasaas-dev-key-change-in-prod-32b',
    );
    const saltBytes = crypto
      .createHash('sha256')
      .update(keyStr)
      .digest()
      .subarray(0, 16);
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

  async upsertCredential(
    input: UpsertCredentialInput,
  ): Promise<MetrcCredential> {
    const encryptedUserApiKey = this.encrypt(input.userApiKey);
    const encryptedIntegratorApiKey = input.integratorApiKey
      ? this.encrypt(input.integratorApiKey)
      : undefined;

    let credential = await this.credentialRepo.findOne({
      where: { dispensaryId: input.dispensaryId },
    });
    if (credential) {
      credential.userApiKey = encryptedUserApiKey;
      if (encryptedIntegratorApiKey)
        credential.integratorApiKey = encryptedIntegratorApiKey;
      credential.state = input.state;
      if (input.metrcUsername) credential.metrcUsername = input.metrcUsername;
      credential.isActive = true;
      credential.validationError = null as unknown as string;
      credential.lastValidatedAt = null as unknown as Date;
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

    credential = await this.credentialRepo.save(credential);

    const validation = await this.validateCredential(input.dispensaryId);
    if (!validation.valid) {
      credential.isActive = false;
      credential.validationError = (validation.message ??
        '') as unknown as string;
      await this.credentialRepo.save(credential);
      throw new BadRequestException(
        `Metrc credential validation failed: ${validation.message}`,
      );
    }

    return credential;
  }

  async getCredential(dispensaryId: string): Promise<MetrcCredential | null> {
    return this.credentialRepo.findOne({
      where: { dispensaryId, isActive: true },
    });
  }

  async listCredentials(): Promise<MetrcCredential[]> {
    return this.credentialRepo.find({ order: { createdAt: 'DESC' } });
  }

  async deactivateCredential(dispensaryId: string): Promise<boolean> {
    const result = await this.credentialRepo.update(
      { dispensaryId },
      { isActive: false },
    );
    return (result.affected ?? 0) > 0;
  }

  async validateCredential(
    dispensaryId: string,
  ): Promise<CredentialValidationResult> {
    const credential = await this.credentialRepo.findOne({
      where: { dispensaryId },
    });
    if (!credential)
      throw new NotFoundException(
        'No Metrc credential found for this dispensary',
      );

    const baseUrl = METRC_BASE_URLS[credential.state];
    if (!baseUrl)
      return {
        valid: false,
        message: `Unsupported state: ${credential.state}`,
      };

    const integratorKey =
      credential.integratorApiKey ??
      this.config.get<string>('metrc.integratorApiKey');
    if (!integratorKey)
      return { valid: false, message: 'No integrator API key configured' };

    const authToken = Buffer.from(
      `${credential.userApiKey}:${integratorKey}`,
    ).toString('base64');

    try {
      const isSandbox = this.config.get<boolean>('metrc.sandboxMode') ?? true;
      const url = isSandbox
        ? `https://sandbox-api-mn.metrc.com/facilities/v2`
        : `${baseUrl}/facilities/v2`;

      const response = await this.breaker.exec(() =>
        fetch(url, {
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (!response.ok) {
        const errorText = await response.text();
        await this.credentialRepo.update(credential.credentialId, {
          lastValidatedAt: new Date(),
          validationError: `HTTP ${response.status}: ${errorText.substring(0, 255)}`,
        });
        return {
          valid: false,
          message: `Metrc API error: HTTP ${response.status}`,
        };
      }

      const facilities = (await response.json()) as MetrcFacility[];
      const facility = facilities[0];
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: null as unknown as string,
      });

      return {
        valid: true,
        message: `Connected to Metrc ${credential.state} — ${facilities.length} facility(ies) found`,
        metrcFacilityName: facility?.Name,
        licenseNumber: facility?.License?.Number,
        licenseType: facility?.License?.LicenseType,
      };
    } catch (err: unknown) {
      const message = errorMessage(err) || 'Network error';
      await this.credentialRepo.update(credential.credentialId, {
        lastValidatedAt: new Date(),
        validationError: message.substring(0, 255),
      });
      return { valid: false, message };
    }
  }

  // ── Product UID Tagging ───────────────────────────────────────────────────

  async tagProductUid(
    input: TagProductUidInput,
    dataSource: DataSource,
  ): Promise<ProductRow | undefined> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const existing = await runnerQuery<IdRow>(
        qr,
        `SELECT id FROM products WHERE metrc_item_uid = $1 AND dispensary_id = $2 AND id != $3`,
        [input.metrcItemUid, input.dispensaryId, input.productId],
      );
      if (existing.length > 0) {
        throw new ConflictException(
          `Metrc Item UID "${input.metrcItemUid}" already assigned to another product`,
        );
      }

      await runnerExec(
        qr,
        `UPDATE products SET metrc_item_uid = $1, updated_at = NOW() WHERE id = $2 AND dispensary_id = $3`,
        [input.metrcItemUid, input.productId, input.dispensaryId],
      );

      const rows = await runnerQuery<ProductRow>(
        qr,
        `SELECT id, name, metrc_item_uid, metrc_item_category_id FROM products WHERE id = $1`,
        [input.productId],
      );
      return rows[0];
    } finally {
      await qr.release();
    }
  }

  // ── Package Label Tagging ─────────────────────────────────────────────────

  async tagPackageLabel(
    input: TagPackageLabelInput,
    dataSource: DataSource,
  ): Promise<VariantRow | undefined> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const existing = await runnerQuery<VariantIdRow>(
        qr,
        `SELECT variant_id FROM product_variants WHERE metrc_package_label = $1 AND dispensary_id = $2 AND variant_id != $3`,
        [input.metrcPackageLabel, input.dispensaryId, input.variantId],
      );
      if (existing.length > 0) {
        throw new ConflictException(
          `Package label "${input.metrcPackageLabel}" already assigned to another variant`,
        );
      }

      await runnerExec(
        qr,
        `UPDATE product_variants SET metrc_package_label = $1, updated_at = NOW() WHERE variant_id = $2 AND dispensary_id = $3`,
        [input.metrcPackageLabel, input.variantId, input.dispensaryId],
      );

      const rows = await runnerQuery<VariantRow>(
        qr,
        `SELECT variant_id, name, metrc_package_label FROM product_variants WHERE variant_id = $1`,
        [input.variantId],
      );
      return rows[0];
    } finally {
      await qr.release();
    }
  }

  // ── Metrc Item Category ───────────────────────────────────────────────────

  async setMetrcCategory(
    input: SetMetrcCategoryInput,
    dataSource: DataSource,
  ): Promise<ProductRow | undefined> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const categories = await runnerQuery<CategoryRow>(
        qr,
        `SELECT metrc_category_id, state, product_type_code FROM lkp_metrc_item_categories WHERE metrc_category_id = $1`,
        [input.metrcItemCategoryId],
      );
      if (categories.length === 0)
        throw new NotFoundException(
          `Metrc item category ${input.metrcItemCategoryId} not found`,
        );

      await runnerExec(
        qr,
        `UPDATE products SET metrc_item_category_id = $1, updated_at = NOW() WHERE id = $2 AND dispensary_id = $3`,
        [input.metrcItemCategoryId, input.productId, input.dispensaryId],
      );

      const rows = await runnerQuery<ProductRow>(
        qr,
        `SELECT id, name, metrc_item_uid, metrc_item_category_id FROM products WHERE id = $1`,
        [input.productId],
      );
      return rows[0];
    } finally {
      await qr.release();
    }
  }

  // ── Compliance Report ─────────────────────────────────────────────────────

  async generateComplianceReport(
    dispensaryId: string,
    dataSource: DataSource,
  ): Promise<ComplianceReport> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const products = await runnerQuery<ComplianceProductRow>(
        qr,
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
        [dispensaryId],
      );

      const issues: ComplianceIssue[] = [];

      for (const p of products) {
        const productIssues: string[] = [];

        if (!p.metrc_item_uid) productIssues.push('Missing Metrc Item UID');
        if (!p.metrc_item_category_id)
          productIssues.push('Missing Metrc Item Category');
        if (!p.is_approved) productIssues.push('Product not approved');

        const variantCount = toInt(p.variant_count);
        const labeledCount = toInt(p.labeled_variant_count);
        if (variantCount > 0 && labeledCount < variantCount) {
          productIssues.push(
            `${variantCount - labeledCount} variant(s) missing Metrc package label`,
          );
        }

        if (productIssues.length > 0) {
          issues.push({
            productId: p.id,
            productName: p.name,
            issues: productIssues,
          });
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
        compliancePercent:
          total > 0 ? Math.round((compliant / total) * 100) : 100,
        issues,
        generatedAt: new Date(),
      };
    } finally {
      await qr.release();
    }
  }

  // ── Bulk UID Tagging ──────────────────────────────────────────────────────

  async bulkTagUids(
    input: BulkTagUidInput,
    dataSource: DataSource,
  ): Promise<BulkTagUidsResponse> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    const results: BulkTagItemResult[] = [];

    for (const pair of input.pairs) {
      try {
        const existing = await runnerQuery<IdRow>(
          qr,
          `SELECT id FROM products WHERE metrc_item_uid = $1 AND dispensary_id = $2 AND id != $3`,
          [pair.metrcItemUid, input.dispensaryId, pair.productId],
        );
        if (existing.length > 0) {
          results.push({
            productId: pair.productId,
            productName: '',
            success: false,
            error: `UID already assigned to another product`,
          });
          continue;
        }

        await runnerExec(
          qr,
          `UPDATE products SET metrc_item_uid = $1, updated_at = NOW() WHERE id = $2 AND dispensary_id = $3`,
          [pair.metrcItemUid, pair.productId, input.dispensaryId],
        );

        const productRows = await runnerQuery<ProductNameRow>(
          qr,
          `SELECT name FROM products WHERE id = $1`,
          [pair.productId],
        );
        results.push({
          productId: pair.productId,
          productName: productRows[0]?.name ?? '',
          success: true,
        });
      } catch (err: unknown) {
        results.push({
          productId: pair.productId,
          productName: '',
          success: false,
          error: errorMessage(err),
        });
      }
    }

    await qr.release();
    return {
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ── Approve Product ───────────────────────────────────────────────────────

  async approveProduct(
    productId: string,
    dispensaryId: string,
    userId: string,
    dataSource: DataSource,
  ): Promise<boolean> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const result = (await qr.query(
        `UPDATE products SET is_approved = true, approved_by_user_id = $1, approved_at = NOW(), updated_at = NOW()
         WHERE id = $2 AND dispensary_id = $3`,
        [userId, productId, dispensaryId],
      )) as unknown;
      if (Array.isArray(result) && typeof result[1] === 'number') {
        return result[1] > 0;
      }
      return false;
    } finally {
      await qr.release();
    }
  }

  // ── Metrc Sales Receipt Sync ──────────────────────────────────────────────

  async syncSaleToMetrc(
    orderId: string,
    dispensaryId: string,
    dataSource: DataSource,
  ): Promise<SyncSaleResult> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();

    try {
      const credential = await this.credentialRepo.findOne({
        where: { dispensaryId, isActive: true },
      });
      if (!credential) {
        return {
          success: false,
          message: 'No active Metrc credential for this dispensary',
        };
      }

      const orderRows = await runnerQuery<OrderRow>(
        qr,
        `SELECT o.*, d.state, d.license_number FROM orders o
         JOIN dispensaries d ON d.entity_id = o."dispensaryId"
         WHERE o."orderId" = $1 AND o."dispensaryId" = $2`,
        [orderId, dispensaryId],
      );
      const order = orderRows[0];
      if (!order) return { success: false, message: 'Order not found' };

      const lineItems = await runnerQuery<LineItemRow>(
        qr,
        `SELECT li.*, p.name as product_name
         FROM order_line_items li
         JOIN products p ON p.id = li."productId"
         WHERE li."orderId" = $1`,
        [orderId],
      );

      const transactions = lineItems
        .filter((li): li is LineItemRow & { metrcItemUid: string } =>
          Boolean(li.metrcItemUid),
        )
        .map((li) => ({
          PackageLabel: li.metrcPackageLabel ?? li.metrcItemUid,
          PackageState: order.state,
          Quantity: toNumber(li.quantity),
          UnitOfMeasure: 'Each',
          TotalAmount: toNumber(li.unitPrice) * toNumber(li.quantity),
        }));

      if (transactions.length === 0) {
        await runnerExec(
          qr,
          `UPDATE orders SET "metrcSyncStatus" = 'skipped', "updatedAt" = NOW() WHERE "orderId" = $1`,
          [orderId],
        );
        return {
          success: false,
          message: 'No Metrc-tagged line items to sync',
        };
      }

      const payload = [
        {
          SalesDateTime: new Date(order.createdAt).toISOString(),
          SalesCustomerType: 'Consumer',
          PatientLicenseNumber: null,
          CaregiverLicenseNumber: null,
          IdentificationMethod: 'DL',
          Transactions: transactions,
        },
      ];

      const syncLogRows = await runnerQuery<SyncLogIdRow>(
        qr,
        `INSERT INTO metrc_sync_logs (
          sync_id, dispensary_id, credential_id, sync_type,
          reference_entity_type, reference_entity_id, status,
          attempt_count, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, 'sale_receipt',
          'order', $3, 'pending', 1, NOW(), NOW()
        ) RETURNING sync_id`,
        [dispensaryId, credential.credentialId, orderId],
      );
      const syncLog = syncLogRows[0];

      const integratorKey =
        credential.integratorApiKey ??
        this.config.get<string>('metrc.integratorApiKey');
      const authToken = Buffer.from(
        `${credential.userApiKey}:${integratorKey}`,
      ).toString('base64');
      const isSandbox = this.config.get<boolean>('metrc.sandboxMode') ?? true;
      const baseUrl = isSandbox
        ? 'https://sandbox-api-mn.metrc.com'
        : `https://api-${order.state.toLowerCase()}.metrc.com`;

      const licenseNumber = order.license_number;
      const response = await this.breaker.exec(() =>
        fetch(
          `${baseUrl}/sales/v2/receipts?licenseNumber=${encodeURIComponent(licenseNumber)}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        ),
      );

      const responseText = await response.text();
      const success = response.ok;

      await runnerExec(
        qr,
        `UPDATE metrc_sync_logs SET
          status = $1, metrc_response = $2, updated_at = NOW()
         WHERE sync_id = $3`,
        [
          success ? 'success' : 'failed',
          JSON.stringify({
            status: response.status,
            body: responseText.substring(0, 500),
          }),
          syncLog.sync_id,
        ],
      );

      await runnerExec(
        qr,
        `UPDATE orders SET "metrcSyncStatus" = $1, "metrcReportedAt" = $2, "updatedAt" = NOW()
         WHERE "orderId" = $3`,
        [success ? 'synced' : 'failed', success ? new Date() : null, orderId],
      );

      return {
        success,
        message: success
          ? `Sale reported to Metrc successfully`
          : `Metrc sync failed: HTTP ${response.status}`,
        syncLogId: syncLog.sync_id,
        metrcReceiptId: success
          ? `METRC-${orderId.substring(0, 8).toUpperCase()}`
          : undefined,
      };
    } catch (err: unknown) {
      return { success: false, message: errorMessage(err) || 'Sync error' };
    } finally {
      await qr.release();
    }
  }

  async getFailedSyncDashboard(
    dispensaryId: string,
    dataSource: DataSource,
  ): Promise<FailedSyncDashboard> {
    const qr = dataSource.createQueryRunner();
    await qr.connect();
    try {
      const items = await runnerQuery<FailedSyncRow>(
        qr,
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
        [dispensaryId],
      );

      const oldest = items.length > 0 ? items[0].created_at_str : null;

      return {
        dispensaryId,
        totalFailed: items.length,
        oldestFailedAt: oldest,
        items: items.map((r) => ({
          orderId: r.orderId,
          orderStatus: r.orderStatus,
          metrcSyncStatus: r.metrcSyncStatus,
          metrcReportedAt: r.metrcReportedAt,
          subtotal: toNumber(r.subtotal),
          total: toNumber(r.total),
          createdAt: r.created_at_str ?? '',
          lastSyncAttempt: r.last_sync_attempt ?? null,
          lastSyncError: r.last_sync_error
            ? r.last_sync_error.substring(0, 200)
            : null,
          attemptCount: r.attempt_count ?? 0,
        })),
      };
    } finally {
      await qr.release();
    }
  }
}
