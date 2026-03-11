import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MetrcCredential } from './entities/metrc-credential.entity';
import { UpsertCredentialInput } from './dto/upsert-credential.input';
import { TagProductUidInput } from './dto/tag-product-uid.input';
import { TagPackageLabelInput } from './dto/tag-package-label.input';
import { SetMetrcCategoryInput } from './dto/set-metrc-category.input';
import { CredentialValidationResult } from './dto/credential-validation-result.type';
import { ComplianceReport, ComplianceIssue } from './dto/compliance-report.type';

const METRC_BASE_URLS: Record<string, string> = {
  NY: 'https://api-mn.metrc.com',
  NJ: 'https://api-nj.metrc.com',
  CT: 'https://api-ct.metrc.com',
};

@Injectable()
export class MetrcService {
  constructor(
    @InjectRepository(MetrcCredential)
    private credentialRepo: Repository<MetrcCredential>,
    private config: ConfigService,
  ) {}

  // ── Credentials ──────────────────────────────────────────────────────────

  async upsertCredential(input: UpsertCredentialInput): Promise<MetrcCredential> {
    let credential = await this.credentialRepo.findOne({ where: { dispensaryId: input.dispensaryId } });
    if (credential) {
      credential.userApiKey = input.userApiKey;
      if (input.integratorApiKey) credential.integratorApiKey = input.integratorApiKey;
      credential.state = input.state;
      if (input.metrcUsername) credential.metrcUsername = input.metrcUsername;
      credential.isActive = true;
      credential.validationError = null as any;
      credential.lastValidatedAt = null as any;
    } else {
      credential = this.credentialRepo.create({
        dispensaryId: input.dispensaryId,
        userApiKey: input.userApiKey,
        integratorApiKey: input.integratorApiKey,
        state: input.state,
        metrcUsername: input.metrcUsername,
        isActive: true,
      });
    }
    return this.credentialRepo.save(credential);
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

      const response = await fetch(url, {
        headers: { Authorization: `Basic ${authToken}`, 'Content-Type': 'application/json' },
      });

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
}
