import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryService } from './inventory.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

interface DispensaryNameRow {
  name: string | null;
  slug: string | null;
}

/**
 * Streams the dispensary-wide inventory audit log as CSV (sc-689).
 * Same filter surface the `/inventory/audit` page exposes: since,
 * until, transactionType, performedByUserId. Tenant-scoped via the
 * JWT — super_admins can pull any tenant, everyone else can only
 * pull their own.
 *
 * Cap chosen at 5000 rows: above that the request should be split
 * by date range. The current page paginates 50 at a time so a 5000
 * export covers ~100 pages of activity — enough for any monthly
 * compliance / accounting / audit pull.
 */
@Controller('inventory/audit')
export class InventoryAuditController {
  constructor(
    private readonly inventory: InventoryService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  @Roles('dispensary_admin', 'org_admin', 'super_admin')
  @Get('export')
  async exportCsv(
    @Query('dispensaryId') dispensaryId: string,
    @Query('since') since: string,
    @Query('until') until: string,
    @Query('transactionType') transactionType: string,
    @Query('performedByUserId') performedByUserId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    if (!dispensaryId) {
      res.status(400).json({ error: 'dispensaryId is required' });
      return;
    }
    if (user.role !== 'super_admin' && user.dispensaryId !== dispensaryId) {
      throw new ForbiddenException('Cross-dispensary audit export denied');
    }

    const rows = await this.inventory.getDispensaryTransactions(dispensaryId, {
      limit: 5000,
      offset: 0,
      since: since ? new Date(since) : null,
      until: until ? new Date(until) : null,
      transactionType: transactionType || null,
      performedByUserId: performedByUserId || null,
    });

    const dispRows = (await this.ds.query(
      `SELECT name, slug FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    )) as unknown as DispensaryNameRow[];
    const dispName = dispRows[0]?.name ?? 'Unknown';
    const dispSlug = (dispRows[0]?.slug ?? 'dispensary').replace(
      /[^a-z0-9-]+/gi,
      '-',
    );

    const sinceLabel = since ? since.slice(0, 10) : 'all';
    const untilLabel = until ? until.slice(0, 10) : 'all';
    const filename = `inventory-audit-${dispSlug}-${sinceLabel}-to-${untilLabel}.csv`;

    const csv = buildAuditCsv(rows, {
      dispensaryName: dispName,
      since: sinceLabel,
      until: untilLabel,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}

interface AuditCsvMeta {
  dispensaryName: string;
  since: string;
  until: string;
}

/** Exported for unit tests. */
export function buildAuditCsv(
  rows: ReadonlyArray<{
    transactionId: string;
    createdAt: Date | string;
    transactionType: string;
    productName: string | null;
    variantName: string | null;
    quantityDelta: string | number;
    quantityBefore: string | number;
    quantityAfter: string | number;
    performedByEmail: string | null;
    referenceOrderId: string | null;
    notes: string | null;
  }>,
  meta: AuditCsvMeta,
): string {
  const headers = [
    'Timestamp',
    'Type',
    'Product',
    'Variant',
    'Quantity Delta',
    'Quantity Before',
    'Quantity After',
    'Performed By',
    'Reference Order',
    'Notes',
  ].join(',');

  const escape = (value: string | number | null | undefined): string => {
    const s =
      value == null ? '' : typeof value === 'number' ? String(value) : value;
    return `"${s.replace(/"/g, '""')}"`;
  };

  const csvRows = rows.map((r) => {
    const ts =
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : new Date(r.createdAt).toISOString();
    return [
      ts,
      r.transactionType,
      r.productName ?? '',
      r.variantName ?? '',
      r.quantityDelta,
      r.quantityBefore,
      r.quantityAfter,
      r.performedByEmail ?? '',
      r.referenceOrderId ?? '',
      r.notes ?? '',
    ]
      .map(escape)
      .join(',');
  });

  const metaHeader = [
    `"Inventory Audit Log: ${meta.dispensaryName}"`,
    `"Range: ${meta.since} to ${meta.until}"`,
    `"Generated: ${new Date().toISOString()}"`,
    '',
  ].join('\n');

  return metaHeader + headers + '\n' + csvRows.join('\n') + '\n';
}
