import { Inject, Injectable, Logger } from '@nestjs/common';
import { Inject, Cron } from '@nestjs/schedule';
import { Inject, EventEmitter2 } from '@nestjs/event-emitter';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class ComplianceAlertsService {
  private readonly logger = new Logger(ComplianceAlertsService.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    private eventEmitter: EventEmitter2
  ) {}

  async checkPurchaseLimitApproaching(customerId: string, dispensaryId: string): Promise<any[]> {
    // Check if customer is at 80%+ of state purchase limit (default 28g/day rolling window)
    const rows = await this._q(
      `WITH purchase_totals AS (
        SELECT
          o."userId",
          SUM(li.quantity * COALESCE(pv.weight_grams, 1)) as total_grams_purchased
        FROM orders o
        JOIN order_line_items li ON li."orderId" = o."orderId"
        LEFT JOIN product_variants pv ON pv.product_id = li."productId"
        WHERE o."userId" = $1 AND o."dispensaryId" = $2
          AND o."orderStatus" = 'completed'
          AND o."createdAt" >= NOW() - INTERVAL '1 day'
        GROUP BY o."userId"
      )
      SELECT
        pt.total_grams_purchased as "totalPurchased",
        28.0 as "dailyLimit",
        ROUND((pt.total_grams_purchased / 28.0) * 100, 1) as "percentUsed"
      FROM purchase_totals pt
      WHERE pt.total_grams_purchased >= 28.0 * 0.8`,
      [customerId, dispensaryId],
    );

    return rows.map((r: any) => ({
      alertType: 'purchase_limit_approaching',
      severity: parseFloat(r.percentUsed) >= 100 ? 'critical' : 'warning',
      customerId,
      totalPurchased: parseFloat(r.totalPurchased),
      dailyLimit: parseFloat(r.dailyLimit),
      percentUsed: parseFloat(r.percentUsed),
      message: `Customer has used ${r.percentUsed}% of daily purchase limit (${r.totalPurchased}g of 28g)`,
    }));
  }

  async checkLicenseExpirations(dispensaryId: string): Promise<any[]> {
    const alerts: any[] = [];

    // Check dispensary license
    const dispLicenses = await this._q(
      `SELECT entity_id as "entityId", name, license_number as "licenseNumber",
        license_expiration_date as "expirationDate"
       FROM dispensaries
       WHERE entity_id = $1
         AND license_expiration_date IS NOT NULL
         AND license_expiration_date <= NOW() + INTERVAL '30 days'`,
      [dispensaryId],
    );

    for (const lic of dispLicenses) {
      const daysLeft = Math.ceil((new Date(lic.expirationDate).getTime() - Date.now()) / 86400000);
      alerts.push({
        alertType: 'license_expiring',
        severity: daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'warning' : 'info',
        entityType: 'dispensary',
        entityId: lic.entityId,
        entityName: lic.name,
        licenseNumber: lic.licenseNumber,
        expirationDate: new Date(lic.expirationDate).toISOString(),
        daysRemaining: daysLeft,
        message: `Dispensary license ${lic.licenseNumber} expires in ${daysLeft} days`,
      });
    }

    // Check employee certifications
    const empCerts = await this._q(
      `SELECT u.id as "userId", u.email, u.first_name as "firstName", u.last_name as "lastName",
        s.certification_expiry as "expirationDate"
       FROM staffing s
       JOIN users u ON u.id = s.user_id
       WHERE s.dispensary_id = $1
         AND s.certification_expiry IS NOT NULL
         AND s.certification_expiry <= NOW() + INTERVAL '30 days'
         AND s.is_active = true`,
      [dispensaryId],
    );

    for (const cert of empCerts) {
      const daysLeft = Math.ceil((new Date(cert.expirationDate).getTime() - Date.now()) / 86400000);
      alerts.push({
        alertType: 'license_expiring',
        severity: daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'warning' : 'info',
        entityType: 'employee',
        entityId: cert.userId,
        entityName: `${cert.firstName} ${cert.lastName}`,
        expirationDate: new Date(cert.expirationDate).toISOString(),
        daysRemaining: daysLeft,
        message: `Employee ${cert.firstName} ${cert.lastName} certification expires in ${daysLeft} days`,
      });
    }

    // Check vendor licenses
    const vendorLicenses = await this._q(
      `SELECT v.vendor_id as "vendorId", v.company_name as "companyName",
        v.license_number as "licenseNumber", v.license_expiration as "expirationDate"
       FROM vendors v
       WHERE v.dispensary_id = $1
         AND v.license_expiration IS NOT NULL
         AND v.license_expiration <= NOW() + INTERVAL '30 days'
         AND v.is_active = true`,
      [dispensaryId],
    );

    for (const v of vendorLicenses) {
      const daysLeft = Math.ceil((new Date(v.expirationDate).getTime() - Date.now()) / 86400000);
      alerts.push({
        alertType: 'license_expiring',
        severity: daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'warning' : 'info',
        entityType: 'vendor',
        entityId: v.vendorId,
        entityName: v.companyName,
        licenseNumber: v.licenseNumber,
        expirationDate: new Date(v.expirationDate).toISOString(),
        daysRemaining: daysLeft,
        message: `Vendor ${v.companyName} license expires in ${daysLeft} days`,
      });
    }

    return alerts;
  }

  async checkInventoryDiscrepancies(dispensaryId: string): Promise<any[]> {
    // Compare local inventory vs last Metrc sync, flag >5% variance
    const rows = await this._q(
      `SELECT
        i.inventory_id as "inventoryId",
        i.variant_id as "variantId",
        p.name as "productName",
        pv.name as "variantName",
        i.quantity_on_hand as "localQuantity",
        i.metrc_quantity as "metrcQuantity",
        i.last_metrc_sync_at as "lastSyncAt",
        CASE
          WHEN COALESCE(i.metrc_quantity, 0) = 0 THEN 100
          ELSE ABS(i.quantity_on_hand - i.metrc_quantity) / i.metrc_quantity * 100
        END as "variancePercent"
       FROM inventory i
       JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE i.dispensary_id = $1
         AND i.metrc_quantity IS NOT NULL
         AND CASE
           WHEN i.metrc_quantity = 0 THEN i.quantity_on_hand > 0
           ELSE ABS(i.quantity_on_hand - i.metrc_quantity) / i.metrc_quantity > 0.05
         END`,
      [dispensaryId],
    );

    return rows.map((r: any) => ({
      alertType: 'inventory_discrepancy',
      severity: parseFloat(r.variancePercent) > 20 ? 'critical' : 'warning',
      inventoryId: r.inventoryId,
      variantId: r.variantId,
      productName: r.productName,
      variantName: r.variantName,
      localQuantity: parseFloat(r.localQuantity),
      metrcQuantity: parseFloat(r.metrcQuantity),
      variancePercent: parseFloat(parseFloat(r.variancePercent).toFixed(1)),
      lastSyncAt: r.lastSyncAt ? new Date(r.lastSyncAt).toISOString() : null,
      message: `${r.productName} has ${parseFloat(r.variancePercent).toFixed(1)}% variance (local: ${r.localQuantity}, Metrc: ${r.metrcQuantity})`,
    }));
  }

  async getComplianceAlerts(dispensaryId: string): Promise<any> {
    const [licenseAlerts, inventoryAlerts] = await Promise.all([
      this.checkLicenseExpirations(dispensaryId),
      this.checkInventoryDiscrepancies(dispensaryId),
    ]);

    const allAlerts = [...licenseAlerts, ...inventoryAlerts];

    // Sort by severity: critical first, then warning, then info
    const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    allAlerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

    return {
      totalAlerts: allAlerts.length,
      criticalCount: allAlerts.filter(a => a.severity === 'critical').length,
      warningCount: allAlerts.filter(a => a.severity === 'warning').length,
      infoCount: allAlerts.filter(a => a.severity === 'info').length,
      alerts: allAlerts,
    };
  }

  @Cron('0 7 * * *')
  async dailyComplianceCheck(): Promise<void> {
    this.logger.log('Running daily compliance alerts check...');
    const dispensaries = await this._q('SELECT entity_id FROM dispensaries WHERE is_active = true');

    for (const d of dispensaries) {
      try {
        const result = await this.getComplianceAlerts(d.entity_id);

        if (result.criticalCount > 0) {
          this.eventEmitter.emit('compliance.critical', {
            dispensaryId: d.entity_id,
            alertCount: result.criticalCount,
            alerts: result.alerts.filter((a: any) => a.severity === 'critical'),
          });
          this.logger.warn(`${result.criticalCount} critical compliance alerts for dispensary ${d.entity_id}`);
        }

        if (result.warningCount > 0) {
          this.eventEmitter.emit('compliance.warning', {
            dispensaryId: d.entity_id,
            alertCount: result.warningCount,
            alerts: result.alerts.filter((a: any) => a.severity === 'warning'),
          });
        }
      } catch (err: any) {
        this.logger.error('Compliance check failed for ' + d.entity_id + ': ' + err.message);
      }
    }
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
