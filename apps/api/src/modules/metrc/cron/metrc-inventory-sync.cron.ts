import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MetrcApiClient } from '../metrc-api.client';

interface DispensaryRow {
  dispensary_id: string;
  state: string;
  license_number: string;
}

interface MetrcPackage {
  Label?: string;
}

interface VariantRow {
  variant_id: string;
  metrc_package_label: string;
  name: string;
  product_name: string;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

@Injectable()
export class MetrcInventorySyncCron {
  private readonly logger = new Logger(MetrcInventorySyncCron.name);

  constructor(
    private readonly metrcApi: MetrcApiClient,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async reconcileInventory(): Promise<void> {
    this.logger.log('Starting nightly Metrc inventory reconciliation...');

    const dispensaries = await rawQuery<DispensaryRow>(
      this.dataSource,
      `SELECT d.entity_id as dispensary_id, d.state, d.license_number
       FROM dispensaries d
       JOIN metrc_credentials mc ON mc.dispensary_id = d.entity_id AND mc.is_active = true
       WHERE d.is_active = true AND d.license_number IS NOT NULL`,
    );

    for (const disp of dispensaries) {
      try {
        await this.reconcileDispensary(disp.dispensary_id, disp.license_number);
      } catch (err: unknown) {
        this.logger.error(
          `Reconciliation failed for ${disp.dispensary_id}: ${errorMessage(err)}`,
        );
      }
    }

    this.logger.log(
      `Inventory reconciliation complete. Processed ${dispensaries.length} dispensaries.`,
    );
  }

  private async reconcileDispensary(
    dispensaryId: string,
    licenseNumber: string,
  ): Promise<void> {
    const result = await this.metrcApi.getActivePackages(
      dispensaryId,
      licenseNumber,
    );
    if (!result.success || !result.data) {
      this.logger.warn(
        `Could not fetch packages for ${dispensaryId}: ${result.error}`,
      );
      return;
    }

    const metrcPackages: MetrcPackage[] = Array.isArray(result.data)
      ? (result.data as MetrcPackage[])
      : [];

    const localVariants = await rawQuery<VariantRow>(
      this.dataSource,
      `SELECT pv.variant_id, pv.metrc_package_label, pv.name, p.name as product_name
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.dispensary_id = $1 AND pv.is_active = true AND pv.metrc_package_label IS NOT NULL`,
      [dispensaryId],
    );

    const metrcLabels = new Set(
      metrcPackages.map((pkg) => pkg.Label).filter((l): l is string => !!l),
    );
    const localLabels = new Set(
      localVariants.map((v) => v.metrc_package_label),
    );

    const inMetrcNotLocal = metrcPackages.filter(
      (pkg) => pkg.Label != null && !localLabels.has(pkg.Label),
    );
    const inLocalNotMetrc = localVariants.filter(
      (v) => !metrcLabels.has(v.metrc_package_label),
    );

    if (inMetrcNotLocal.length > 0 || inLocalNotMetrc.length > 0) {
      this.logger.warn(
        `Discrepancies for ${dispensaryId}: ` +
          `${inMetrcNotLocal.length} in Metrc but not local, ` +
          `${inLocalNotMetrc.length} in local but not Metrc`,
      );

      await this.dataSource.query(
        `INSERT INTO compliance_logs (log_id, dispensary_id, event_type, entity_type, action, details, created_at)
         VALUES (gen_random_uuid(), $1, 'inventory_discrepancy', 'inventory', 'reconciliation', $2, NOW())`,
        [
          dispensaryId,
          JSON.stringify({
            inMetrcNotLocal: inMetrcNotLocal.map((p) => p.Label),
            inLocalNotMetrc: inLocalNotMetrc.map((v) => v.metrc_package_label),
            metrcPackageCount: metrcPackages.length,
            localVariantCount: localVariants.length,
          }),
        ],
      );
    } else {
      this.logger.log(
        `Dispensary ${dispensaryId}: inventory in sync (${metrcPackages.length} packages)`,
      );
    }
  }
}
