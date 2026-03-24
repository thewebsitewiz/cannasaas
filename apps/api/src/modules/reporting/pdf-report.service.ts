import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { validateUUID, validateDateString } from '../../common/helpers/validation.helpers';

@Injectable()
export class PdfReportService {
  private readonly logger = new Logger(PdfReportService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // SALES PDF
  // ═══════════════════════════════════════════════════════════════════════════

  async generateSalesReport(dispensaryId: string, startDate: string, endDate: string): Promise<string> {
    validateUUID(dispensaryId, 'dispensaryId');
    validateDateString(startDate, 'startDate');
    validateDateString(endDate, 'endDate');

    const [disp] = await this.ds.query(
      `SELECT name, license_number FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );

    const sales = await this.ds.query(`
      SELECT DATE(o."createdAt") as date, COUNT(*) as orders,
             COALESCE(SUM(o.total), 0)::DECIMAL(12,2) as revenue,
             COALESCE(SUM(o."taxTotal"), 0)::DECIMAL(12,2) as tax,
             COALESCE(SUM(o."discountTotal"), 0)::DECIMAL(12,2) as discounts
      FROM orders o WHERE o."dispensaryId" = $1
        AND o."createdAt" >= $2::DATE AND o."createdAt" < $3::DATE + INTERVAL '1 day'
        AND o."orderStatus" != 'cancelled'
      GROUP BY DATE(o."createdAt") ORDER BY date
    `, [dispensaryId, startDate, endDate]);

    return this.renderHtml(
      'Sales Report',
      disp?.name ?? 'Unknown Dispensary',
      disp?.license_number,
      startDate,
      endDate,
      sales,
      [
        { key: 'date', label: 'Date' },
        { key: 'orders', label: 'Orders' },
        { key: 'revenue', label: 'Revenue', format: 'currency' },
        { key: 'tax', label: 'Tax', format: 'currency' },
        { key: 'discounts', label: 'Discounts', format: 'currency' },
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLIANCE PDF
  // ═══════════════════════════════════════════════════════════════════════════

  async generateComplianceReport(dispensaryId: string, startDate: string, endDate: string): Promise<string> {
    validateUUID(dispensaryId, 'dispensaryId');
    validateDateString(startDate, 'startDate');
    validateDateString(endDate, 'endDate');

    const [disp] = await this.ds.query(
      `SELECT name, license_number FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );

    const audits = await this.ds.query(`
      SELECT DATE(al.created_at) as date,
             al.action, al.entity_type,
             COUNT(*) as event_count,
             COUNT(DISTINCT al.user_id) as unique_users
      FROM audit_logs al
      WHERE al.dispensary_id = $1
        AND al.created_at >= $2::DATE AND al.created_at < $3::DATE + INTERVAL '1 day'
      GROUP BY DATE(al.created_at), al.action, al.entity_type
      ORDER BY date, al.entity_type
    `, [dispensaryId, startDate, endDate]);

    return this.renderHtml(
      'Compliance Audit Report',
      disp?.name ?? 'Unknown Dispensary',
      disp?.license_number,
      startDate,
      endDate,
      audits,
      [
        { key: 'date', label: 'Date' },
        { key: 'entity_type', label: 'Entity' },
        { key: 'action', label: 'Action' },
        { key: 'event_count', label: 'Events' },
        { key: 'unique_users', label: 'Users' },
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY PDF
  // ═══════════════════════════════════════════════════════════════════════════

  async generateInventoryReport(dispensaryId: string): Promise<string> {
    validateUUID(dispensaryId, 'dispensaryId');

    const [disp] = await this.ds.query(
      `SELECT name, license_number FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );

    const inventory = await this.ds.query(`
      SELECT p.name as product_name, pv.name as variant_name, pv.sku,
             i.quantity_on_hand, i.quantity_available,
             COALESCE(pp.price, 0)::DECIMAL(10,2) as unit_price,
             ROUND(i.quantity_on_hand * COALESCE(pp.price, 0), 2) as total_value,
             i.lot_number, i.expiration_date
      FROM inventory i
      JOIN product_variants pv ON pv.variant_id = i.variant_id
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN product_pricing pp ON pp.variant_id = i.variant_id
        AND pp.dispensary_id = i.dispensary_id AND pp.price_type = 'retail'
      WHERE i.dispensary_id = $1
      ORDER BY p.name, pv.name
    `, [dispensaryId]);

    return this.renderHtml(
      'Inventory Report',
      disp?.name ?? 'Unknown Dispensary',
      disp?.license_number,
      '',
      '',
      inventory,
      [
        { key: 'product_name', label: 'Product' },
        { key: 'variant_name', label: 'Variant' },
        { key: 'sku', label: 'SKU' },
        { key: 'quantity_on_hand', label: 'On Hand' },
        { key: 'quantity_available', label: 'Available' },
        { key: 'unit_price', label: 'Unit Price', format: 'currency' },
        { key: 'total_value', label: 'Total Value', format: 'currency' },
        { key: 'lot_number', label: 'Lot #' },
        { key: 'expiration_date', label: 'Expires' },
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYROLL PDF
  // ═══════════════════════════════════════════════════════════════════════════

  async generatePayrollReport(dispensaryId: string, startDate: string, endDate: string): Promise<string> {
    validateUUID(dispensaryId, 'dispensaryId');
    validateDateString(startDate, 'startDate');
    validateDateString(endDate, 'endDate');

    const [disp] = await this.ds.query(
      `SELECT name, license_number FROM dispensaries WHERE entity_id = $1`, [dispensaryId],
    );

    const payroll = await this.ds.query(`
      SELECT ep.employee_number,
             u."firstName" as first_name, u."lastName" as last_name,
             lp.name as position,
             COALESCE(SUM(te.total_hours), 0)::DECIMAL(8,2) as regular_hours,
             COALESCE(SUM(CASE WHEN te.total_hours > 8 THEN te.total_hours - 8 ELSE 0 END), 0)::DECIMAL(8,2) as overtime_hours,
             ep.hourly_rate,
             ROUND(COALESCE(SUM(LEAST(te.total_hours, 8)), 0) * ep.hourly_rate, 2) as regular_pay,
             ROUND(COALESCE(SUM(CASE WHEN te.total_hours > 8 THEN te.total_hours - 8 ELSE 0 END), 0) * ep.hourly_rate * 1.5, 2) as overtime_pay,
             ROUND(COALESCE(SUM(te.total_hours), 0) * ep.hourly_rate
               + COALESCE(SUM(CASE WHEN te.total_hours > 8 THEN (te.total_hours - 8) * 0.5 ELSE 0 END), 0) * ep.hourly_rate, 2) as gross_pay
      FROM employee_profiles ep
      JOIN users u ON u.id = ep.user_id
      LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
      LEFT JOIN time_entries te ON te.profile_id = ep.profile_id
        AND te.clock_in >= $2::DATE AND te.clock_in < $3::DATE + INTERVAL '1 day'
        AND te.status IN ('completed','approved')
      WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active'
      GROUP BY ep.profile_id, ep.employee_number, u."firstName", u."lastName",
               lp.name, ep.hourly_rate
      ORDER BY u."lastName", u."firstName"
    `, [dispensaryId, startDate, endDate]);

    return this.renderHtml(
      'Payroll Report',
      disp?.name ?? 'Unknown Dispensary',
      disp?.license_number,
      startDate,
      endDate,
      payroll,
      [
        { key: 'employee_number', label: 'Emp #' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'position', label: 'Position' },
        { key: 'regular_hours', label: 'Reg Hours' },
        { key: 'overtime_hours', label: 'OT Hours' },
        { key: 'hourly_rate', label: 'Rate', format: 'currency' },
        { key: 'regular_pay', label: 'Reg Pay', format: 'currency' },
        { key: 'overtime_pay', label: 'OT Pay', format: 'currency' },
        { key: 'gross_pay', label: 'Gross Pay', format: 'currency' },
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTML RENDERER
  // ═══════════════════════════════════════════════════════════════════════════

  private renderHtml(
    title: string,
    dispensaryName: string,
    licenseNumber: string | undefined,
    startDate: string,
    endDate: string,
    rows: any[],
    columns: { key: string; label: string; format?: string }[],
  ): string {
    const formatValue = (value: any, format?: string): string => {
      if (value == null || value === '') return '&mdash;';
      if (format === 'currency') return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      if (value instanceof Date) return value.toISOString().split('T')[0];
      return String(value);
    };

    // Summary: sum numeric / currency columns
    const summaryItems = columns
      .filter(c => c.format === 'currency')
      .map(c => {
        const total = rows.reduce((sum, r) => sum + (parseFloat(r[c.key]) || 0), 0);
        return `<div class="summary-item"><span class="summary-label">${c.label}</span><span class="summary-value">$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>`;
      });

    const dateRange = startDate && endDate ? `${startDate} &mdash; ${endDate}` : `As of ${new Date().toISOString().split('T')[0]}`;

    const tableHeaders = columns.map(c => `<th>${c.label}</th>`).join('');
    const tableRows = rows.map(row => {
      const cells = columns.map(c => {
        const align = c.format === 'currency' ? ' class="right"' : '';
        return `<td${align}>${formatValue(row[c.key], c.format)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - ${dispensaryName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; color: #2563eb; margin-bottom: 4px; }
  .header .subtitle { color: #666; font-size: 14px; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 20px; color: #555; font-size: 12px; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
  .summary-item { background: #f0f4ff; border-radius: 8px; padding: 12px 20px; min-width: 140px; }
  .summary-label { display: block; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-value { display: block; font-size: 20px; font-weight: 700; color: #2563eb; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  tr:hover { background: #fafbfc; }
  .right { text-align: right; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print {
    body { padding: 20px; }
    .summary-item { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    tr:hover { background: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="subtitle">${dispensaryName}${licenseNumber ? ` &bull; License: ${licenseNumber}` : ''}</div>
  </div>
  <div class="meta">
    <span>Period: ${dateRange}</span>
    <span>${rows.length} record${rows.length !== 1 ? 's' : ''}</span>
  </div>
  ${summaryItems.length > 0 ? `<div class="summary">${summaryItems.join('')}</div>` : ''}
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>Generated: ${new Date().toISOString()}</span>
    <span>CannaSaaS Reporting</span>
  </div>
</body>
</html>`;
  }
}
