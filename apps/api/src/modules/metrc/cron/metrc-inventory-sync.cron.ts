import { Inject, Injectable, Logger } from '@nestjs/common';
import { Inject, Cron, CronExpression } from '@nestjs/schedule';
import { Inject, MetrcApiClient } from '../metrc-api.client';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class MetrcInventorySyncCron {
  private readonly logger = new Logger(MetrcInventorySyncCron.name);

  constructor(
    private readonly metrcApi: MetrcApiClient,
    @Inject(DRIZZLE) private db: any
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async reconcileInventory(): Promise<void> {
    this.logger.log('Starting nightly Metrc inventory reconciliation...');

    const dispensaries = await this._q(
      `SELECT d.entity_id as dispensary_id, d.state, d.license_number
       FROM dispensaries d
       JOIN metrc_credentials mc ON mc.dispensary_id = d.entity_id AND mc.is_active = true
       WHERE d.is_active = true AND d.license_number IS NOT NULL`
    );

    for (const disp of dispensaries) {
      try {
        await this.reconcileDispensary(disp.dispensary_id, disp.license_number);
      } catch (err: any) {
        this.logger.error(`Reconciliation failed for ${disp.dispensary_id}: ${err.message}`);
      }
    }

    this.logger.log(`Inventory reconciliation complete. Processed ${dispensaries.length} dispensaries.`);
  }

  private async reconcileDispensary(dispensaryId: string, licenseNumber: string): Promise<void> {
    // 1. Pull active packages from Metrc
    const result = await this.metrcApi.getActivePackages(dispensaryId, licenseNumber);
    if (!result.success || !result.data) {
      this.logger.warn(`Could not fetch packages for ${dispensaryId}: ${result.error}`);
      return;
    }

    const metrcPackages = Array.isArray(result.data) ? result.data : [];

    // 2. Get local variants with package labels
    const localVariants = await this._q(
      `SELECT pv.variant_id, pv.metrc_package_label, pv.name, p.name as product_name
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.dispensary_id = $1 AND pv.is_active = true AND pv.metrc_package_label IS NOT NULL`,
      [dispensaryId]
    );

    // 3. Build lookup maps
    const metrcLabels = new Set(metrcPackages.map((pkg: any) => pkg.Label));
    const localLabels = new Set(localVariants.map((v: any) => v.metrc_package_label));

    // 4. Find discrepancies
    const inMetrcNotLocal = metrcPackages.filter((pkg: any) => !localLabels.has(pkg.Label));
    const inLocalNotMetrc = localVariants.filter((v: any) => !metrcLabels.has(v.metrc_package_label));

    if (inMetrcNotLocal.length > 0 || inLocalNotMetrc.length > 0) {
      this.logger.warn(
        `Discrepancies for ${dispensaryId}: ` +
        `${inMetrcNotLocal.length} in Metrc but not local, ` +
        `${inLocalNotMetrc.length} in local but not Metrc`
      );

      // Log discrepancies
      await this._q(
        `INSERT INTO compliance_logs (log_id, dispensary_id, event_type, entity_type, action, details, created_at)
         VALUES (gen_random_uuid(), $1, 'inventory_discrepancy', 'inventory', 'reconciliation', $2, NOW())`,
        [dispensaryId, JSON.stringify({
          inMetrcNotLocal: inMetrcNotLocal.map((p: any) => p.Label),
          inLocalNotMetrc: inLocalNotMetrc.map((v: any) => v.metrc_package_label),
          metrcPackageCount: metrcPackages.length,
          localVariantCount: localVariants.length,
        })]
      );
    } else {
      this.logger.log(`Dispensary ${dispensaryId}: inventory in sync (${metrcPackages.length} packages)`);
    }
  }

  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) { const r = await client.query(text, params); return r.rows ?? r; }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }
}
