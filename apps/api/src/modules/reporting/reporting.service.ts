import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  validateUUID,
  validateDateString,
} from '../../common/helpers/validation.helpers';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// ── DB row types ──────────────────────────────────────────────────────────

interface SalesSummaryRow {
  total_orders: string | number;
  completed_orders: string | number;
  cancelled_orders: string | number;
  gross_sales: string | number;
  total_discounts: string | number;
  total_tax: string | number;
  net_revenue: string | number;
  avg_order_value: string | number;
  delivery_orders: string | number;
  pickup_orders: string | number;
  cash_orders: string | number;
  card_orders: string | number;
  total_cash_discounts: string | number;
}

interface DailySalesRow {
  date: string;
  orders: string | number;
  gross: string | number;
  discounts: string | number;
  tax: string | number;
  net: string | number;
}

interface ProductSalesRow {
  product_name: string;
  strain_type: string | null;
  variant_name: string | null;
  orders: string | number;
  units_sold: string | number;
  revenue: string | number;
}

interface HourlySalesRow {
  hour: number;
  orders: string | number;
  revenue: string | number;
}

interface DispensaryMetaRow {
  name?: string;
  state?: string;
  license_number?: string;
}

interface TaxTotalsRow {
  taxable_sales: string | number;
  total_discounts: string | number;
  net_taxable: string | number;
  total_tax_collected: string | number;
  transaction_count: string | number;
}

interface TaxBreakdownRow {
  tax_name: string;
  tax_code: string;
  rate: string | number;
  tax_basis: string;
  statutory_reference: string | null;
  estimated_tax: string | number;
}

interface StaffPerformanceRow {
  employee_number: string;
  firstName: string;
  lastName: string;
  position_name: string | null;
  total_hours: string | number;
  shifts_worked: string | number;
  overtime_hours: string | number;
  hourly_rate: string | number;
  labor_cost: string | number;
  latest_review_rating: string | number | null;
  active_certs: string | number;
  expired_certs: string | number;
}

interface LaborCostRow {
  employee_count: string | number;
  total_hours: string | number;
  total_labor_cost: string | number;
  total_revenue: string | number;
}

interface InventoryValuationRow {
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity_on_hand: string | number;
  quantity_reserved: string | number;
  quantity_available: string | number;
  unit_price: string | number | null;
  total_value: string | number;
  lot_number: string | null;
  expiration_date: string | Date | null;
  last_movement_at: string | Date | null;
}

interface ShrinkageAdjustmentRow {
  reason: string;
  reason_code: string;
  adjustment_count: string | number;
  total_units: string | number;
  estimated_value: string | number;
}

// ── Public API result types ───────────────────────────────────────────────

export interface SalesSummary {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  grossSales: number;
  totalDiscounts: number;
  totalTax: number;
  netRevenue: number;
  avgOrderValue: number;
  deliveryOrders: number;
  pickupOrders: number;
  cashOrders: number;
  cardOrders: number;
  totalCashDiscounts: number;
}

export interface DailySales {
  date: string;
  orders: number;
  gross: number;
  discounts: number;
  tax: number;
  net: number;
}

export interface ProductSales {
  productName: string;
  strainType?: string;
  variantName?: string;
  orders: number;
  unitsSold: number;
  revenue: number;
}

export interface HourlySales {
  hour: number;
  orders: number;
  revenue: number;
}

export interface TaxBreakdownItem {
  taxName: string;
  taxCode: string;
  rate: number;
  taxBasis: string;
  statutoryReference?: string;
  estimatedTax: number;
}

export interface TaxReport {
  dispensaryName?: string;
  state?: string;
  licenseNumber?: string;
  taxableSales: number;
  totalDiscounts: number;
  netTaxable: number;
  totalTaxCollected: number;
  transactionCount: number;
  taxBreakdown: TaxBreakdownItem[];
}

export interface LaborCostSummary {
  employeeCount: number;
  totalHours: number;
  totalLaborCost: number;
  totalRevenue: number;
  laborCostPercent: number;
}

export interface ShrinkageByReason {
  reason: string;
  reasonCode: string;
  count: number;
  units: number;
  estimatedValue: number;
}

export interface ShrinkageReport {
  totalAdjustments: number;
  totalUnitsLost: number;
  estimatedValueLost: number;
  byReason: ShrinkageByReason[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
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
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // SALES REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  async salesSummary(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<SalesSummary> {
    validateUUID(dispensaryId, 'dispensaryId');
    validateDateString(startDate, 'startDate');
    validateDateString(endDate, 'endDate');
    if (new Date(startDate) > new Date(endDate))
      throw new BadRequestException('startDate must be before endDate');
    const rows = await rawQuery<SalesSummaryRow>(
      this.ds,
      `SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE "orderStatus" = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE "orderStatus" = 'cancelled') as cancelled_orders,
        COALESCE(SUM(subtotal) FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(12,2) as gross_sales,
        COALESCE(SUM("discountTotal") FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(12,2) as total_discounts,
        COALESCE(SUM("taxTotal") FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(12,2) as total_tax,
        COALESCE(SUM(total) FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(12,2) as net_revenue,
        COALESCE(AVG(total) FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(10,2) as avg_order_value,
        COUNT(*) FILTER (WHERE "orderType" = 'delivery' AND "orderStatus" = 'completed') as delivery_orders,
        COUNT(*) FILTER (WHERE "orderType" = 'pickup' AND "orderStatus" = 'completed') as pickup_orders,
        COUNT(*) FILTER (WHERE payment_method = 'cash' AND "orderStatus" = 'completed') as cash_orders,
        COUNT(*) FILTER (WHERE payment_method = 'card' AND "orderStatus" = 'completed') as card_orders,
        COALESCE(SUM(cash_discount_applied) FILTER (WHERE "orderStatus" = 'completed'), 0)::DECIMAL(10,2) as total_cash_discounts
       FROM orders WHERE "dispensaryId" = $1 AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE + INTERVAL '1 day'`,
      [dispensaryId, startDate, endDate],
    );
    const summary = rows[0];
    return {
      totalOrders: toInt(summary.total_orders),
      completedOrders: toInt(summary.completed_orders),
      cancelledOrders: toInt(summary.cancelled_orders),
      grossSales: toNumber(summary.gross_sales),
      totalDiscounts: toNumber(summary.total_discounts),
      totalTax: toNumber(summary.total_tax),
      netRevenue: toNumber(summary.net_revenue),
      avgOrderValue: toNumber(summary.avg_order_value),
      deliveryOrders: toInt(summary.delivery_orders),
      pickupOrders: toInt(summary.pickup_orders),
      cashOrders: toInt(summary.cash_orders),
      cardOrders: toInt(summary.card_orders),
      totalCashDiscounts: toNumber(summary.total_cash_discounts),
    };
  }

  async salesByDay(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailySales[]> {
    const rows = await rawQuery<DailySalesRow>(
      this.ds,
      `SELECT DATE("createdAt") as date,
        COUNT(*) as orders,
        COALESCE(SUM(subtotal), 0)::DECIMAL(10,2) as gross,
        COALESCE(SUM("discountTotal"), 0)::DECIMAL(10,2) as discounts,
        COALESCE(SUM("taxTotal"), 0)::DECIMAL(10,2) as tax,
        COALESCE(SUM(total), 0)::DECIMAL(10,2) as net
       FROM orders WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
        AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE + INTERVAL '1 day'
       GROUP BY DATE("createdAt") ORDER BY date`,
      [dispensaryId, startDate, endDate],
    );
    return rows.map((r) => ({
      date: r.date,
      orders: toInt(r.orders),
      gross: toNumber(r.gross),
      discounts: toNumber(r.discounts),
      tax: toNumber(r.tax),
      net: toNumber(r.net),
    }));
  }

  async salesByProduct(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<ProductSales[]> {
    const rows = await rawQuery<ProductSalesRow>(
      this.ds,
      `SELECT p.name as product_name, p.strain_type, pv.name as variant_name,
        COUNT(DISTINCT o."orderId") as orders,
        SUM(oi.quantity) as units_sold,
        SUM(oi.line_total)::DECIMAL(10,2) as revenue
       FROM order_items oi
       JOIN orders o ON o."orderId" = oi.order_id
       JOIN product_variants pv ON pv.variant_id = oi.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
        AND o."createdAt" >= $2::DATE AND o."createdAt" < $3::DATE + INTERVAL '1 day'
       GROUP BY p.name, p.strain_type, pv.name
       ORDER BY revenue DESC`,
      [dispensaryId, startDate, endDate],
    );
    return rows.map((r) => ({
      productName: r.product_name,
      strainType: r.strain_type ?? undefined,
      variantName: r.variant_name ?? undefined,
      orders: toInt(r.orders),
      unitsSold: toInt(r.units_sold),
      revenue: toNumber(r.revenue),
    }));
  }

  async salesByHour(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<HourlySales[]> {
    const rows = await rawQuery<HourlySalesRow>(
      this.ds,
      `SELECT EXTRACT(HOUR FROM "createdAt")::INT as hour,
        COUNT(*) as orders,
        COALESCE(SUM(total), 0)::DECIMAL(10,2) as revenue
       FROM orders WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
        AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE + INTERVAL '1 day'
       GROUP BY hour ORDER BY hour`,
      [dispensaryId, startDate, endDate],
    );
    return rows.map((r) => ({
      hour: r.hour,
      orders: toInt(r.orders),
      revenue: toNumber(r.revenue),
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAX REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  async taxReport(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<TaxReport> {
    validateUUID(dispensaryId, 'dispensaryId');
    validateDateString(startDate, 'startDate');
    validateDateString(endDate, 'endDate');
    const dispRows = await rawQuery<DispensaryMetaRow>(
      this.ds,
      `SELECT name, state, license_number FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = dispRows[0];

    const totalsRows = await rawQuery<TaxTotalsRow>(
      this.ds,
      `SELECT
        COALESCE(SUM(subtotal), 0)::DECIMAL(12,2) as taxable_sales,
        COALESCE(SUM("discountTotal"), 0)::DECIMAL(12,2) as total_discounts,
        COALESCE(SUM(subtotal) - SUM("discountTotal"), 0)::DECIMAL(12,2) as net_taxable,
        COALESCE(SUM("taxTotal"), 0)::DECIMAL(12,2) as total_tax_collected,
        COUNT(*) as transaction_count
       FROM orders WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
        AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE + INTERVAL '1 day'`,
      [dispensaryId, startDate, endDate],
    );
    const totals = totalsRows[0];

    const taxByCategory = await rawQuery<TaxBreakdownRow>(
      this.ds,
      `SELECT
        tc.name as tax_name, tc.code as tax_code, tc.rate, tc.tax_basis,
        tc.statutory_reference,
        COALESCE(SUM(
          CASE tc.tax_basis
            WHEN 'retail_price' THEN o.subtotal * tc.rate
            ELSE 0
          END
        ), 0)::DECIMAL(10,2) as estimated_tax
       FROM lkp_tax_categories tc
       CROSS JOIN orders o
       WHERE tc.state = $1 AND tc.is_active = true
        AND o."dispensaryId" = $2 AND o."orderStatus" = 'completed'
        AND o."createdAt" >= $3::DATE AND o."createdAt" < $4::DATE + INTERVAL '1 day'
       GROUP BY tc.tax_category_id, tc.name, tc.code, tc.rate, tc.tax_basis, tc.statutory_reference
       ORDER BY tc.tax_category_id`,
      [disp?.state ?? 'NY', dispensaryId, startDate, endDate],
    );

    return {
      dispensaryName: disp?.name,
      state: disp?.state,
      licenseNumber: disp?.license_number,
      taxableSales: toNumber(totals.taxable_sales),
      totalDiscounts: toNumber(totals.total_discounts),
      netTaxable: toNumber(totals.net_taxable),
      totalTaxCollected: toNumber(totals.total_tax_collected),
      transactionCount: toInt(totals.transaction_count),
      taxBreakdown: taxByCategory.map((t) => ({
        taxName: t.tax_name,
        taxCode: t.tax_code,
        rate: toNumber(t.rate),
        taxBasis: t.tax_basis,
        statutoryReference: t.statutory_reference ?? undefined,
        estimatedTax: toNumber(t.estimated_tax),
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF PERFORMANCE REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  async staffPerformance(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<StaffPerformanceRow[]> {
    return rawQuery<StaffPerformanceRow>(
      this.ds,
      `SELECT ep.employee_number, u."firstName", u."lastName",
        lp.name as position_name,
        COALESCE(SUM(te.total_hours), 0)::DECIMAL(8,2) as total_hours,
        COUNT(DISTINCT te.entry_id) FILTER (WHERE te.status IN ('completed','approved')) as shifts_worked,
        COALESCE(SUM(CASE WHEN te.total_hours > 8 THEN te.total_hours - 8 ELSE 0 END), 0)::DECIMAL(8,2) as overtime_hours,
        ep.hourly_rate,
        ROUND(COALESCE(SUM(te.total_hours), 0) * ep.hourly_rate, 2) as labor_cost,
        pr.overall_rating as latest_review_rating,
        (SELECT COUNT(*) FROM employee_certifications ec WHERE ec.profile_id = ep.profile_id AND ec.status IN ('active','verified')) as active_certs,
        (SELECT COUNT(*) FROM employee_certifications ec WHERE ec.profile_id = ep.profile_id AND ec.status = 'expired') as expired_certs
       FROM employee_profiles ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       LEFT JOIN time_entries te ON te.profile_id = ep.profile_id
         AND te.clock_in >= $2::DATE AND te.clock_in < $3::DATE + INTERVAL '1 day'
         AND te.status IN ('completed','approved')
       LEFT JOIN LATERAL (
         SELECT overall_rating FROM performance_reviews
         WHERE profile_id = ep.profile_id AND status = 'completed'
         ORDER BY review_period_end DESC LIMIT 1
       ) pr ON true
       WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active'
       GROUP BY ep.profile_id, ep.employee_number, u."firstName", u."lastName",
                lp.name, ep.hourly_rate, pr.overall_rating
       ORDER BY labor_cost DESC`,
      [dispensaryId, startDate, endDate],
    );
  }

  async laborCostSummary(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<LaborCostSummary> {
    const rows = await rawQuery<LaborCostRow>(
      this.ds,
      `SELECT
        COUNT(DISTINCT ep.profile_id) as employee_count,
        COALESCE(SUM(te.total_hours), 0)::DECIMAL(8,2) as total_hours,
        ROUND(COALESCE(SUM(te.total_hours * ep.hourly_rate), 0), 2) as total_labor_cost,
        COALESCE(SUM(o_rev.revenue), 0)::DECIMAL(12,2) as total_revenue
       FROM employee_profiles ep
       LEFT JOIN time_entries te ON te.profile_id = ep.profile_id
         AND te.clock_in >= $2::DATE AND te.clock_in < $3::DATE + INTERVAL '1 day'
         AND te.status IN ('completed','approved')
       LEFT JOIN LATERAL (
         SELECT SUM(total) as revenue FROM orders
         WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed'
           AND "createdAt" >= $2::DATE AND "createdAt" < $3::DATE + INTERVAL '1 day'
       ) o_rev ON true
       WHERE ep.dispensary_id = $1 AND ep.employment_status = 'active'`,
      [dispensaryId, startDate, endDate],
    );
    const result = rows[0];

    const laborCost = toNumber(result.total_labor_cost);
    const revenue = toNumber(result.total_revenue);

    return {
      employeeCount: toInt(result.employee_count),
      totalHours: toNumber(result.total_hours),
      totalLaborCost: laborCost,
      totalRevenue: revenue,
      laborCostPercent:
        revenue > 0 ? parseFloat(((laborCost / revenue) * 100).toFixed(1)) : 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INVENTORY REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  async inventoryValuation(
    dispensaryId: string,
  ): Promise<InventoryValuationRow[]> {
    return rawQuery<InventoryValuationRow>(
      this.ds,
      `SELECT p.name as product_name, pv.name as variant_name, pv.sku,
        i.quantity_on_hand, i.quantity_reserved, i.quantity_available,
        pp.price as unit_price,
        ROUND(i.quantity_on_hand * COALESCE(pp.price, 0), 2) as total_value,
        i.expiration_date, i.lot_number, i.last_movement_at
       FROM inventory i
       JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       LEFT JOIN product_pricing pp ON pp.variant_id = i.variant_id AND pp.dispensary_id = i.dispensary_id AND pp.price_type = 'retail'
       WHERE i.dispensary_id = $1
       ORDER BY total_value DESC`,
      [dispensaryId],
    );
  }

  async shrinkageReport(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<ShrinkageReport> {
    const adjustments = await rawQuery<ShrinkageAdjustmentRow>(
      this.ds,
      `SELECT lr.name as reason, lr.code as reason_code,
        COUNT(*) as adjustment_count,
        SUM(ABS(ia.quantity_change)) as total_units,
        SUM(ABS(ia.quantity_change) * COALESCE(pp.price, 0))::DECIMAL(10,2) as estimated_value
       FROM inventory_adjustments ia
       JOIN lkp_adjustment_reasons lr ON lr.reason_id = ia.reason_id
       LEFT JOIN product_pricing pp ON pp.variant_id = ia.variant_id AND pp.dispensary_id = ia.dispensary_id AND pp.price_type = 'retail'
       WHERE ia.dispensary_id = $1 AND ia.quantity_change < 0
        AND ia.created_at >= $2::DATE AND ia.created_at < $3::DATE + INTERVAL '1 day'
       GROUP BY lr.name, lr.code
       ORDER BY estimated_value DESC`,
      [dispensaryId, startDate, endDate],
    );

    const totalUnits = adjustments.reduce(
      (s, a) => s + toInt(a.total_units),
      0,
    );
    const totalValue = adjustments.reduce(
      (s, a) => s + toNumber(a.estimated_value),
      0,
    );

    return {
      totalAdjustments: adjustments.reduce(
        (s, a) => s + toInt(a.adjustment_count),
        0,
      ),
      totalUnitsLost: totalUnits,
      estimatedValueLost: parseFloat(totalValue.toFixed(2)),
      byReason: adjustments.map((a) => ({
        reason: a.reason,
        reasonCode: a.reason_code,
        count: toInt(a.adjustment_count),
        units: toInt(a.total_units),
        estimatedValue: toNumber(a.estimated_value),
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CSV GENERATORS
  // ═══════════════════════════════════════════════════════════════════════════

  async generateSalesCsv(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const dispRows = await rawQuery<DispensaryMetaRow>(
      this.ds,
      `SELECT name FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = dispRows[0];
    const daily = await this.salesByDay(dispensaryId, startDate, endDate);
    const summary = await this.salesSummary(dispensaryId, startDate, endDate);

    const meta = `"Sales Report: ${disp?.name ?? 'Unknown'}"\n"Period: ${startDate} to ${endDate}"\n"Generated: ${new Date().toISOString()}"\n`;
    const summaryLines = `\n"Summary"\n"Total Orders","${summary.completedOrders}"\n"Gross Sales","${summary.grossSales}"\n"Discounts","${summary.totalDiscounts}"\n"Tax Collected","${summary.totalTax}"\n"Net Revenue","${summary.netRevenue}"\n"Avg Order","${summary.avgOrderValue}"\n"Cash Orders","${summary.cashOrders}"\n"Card Orders","${summary.cardOrders}"\n`;

    const headers =
      '\n"Daily Breakdown"\nDate,Orders,Gross,Discounts,Tax,Net\n';
    const rows = daily
      .map(
        (d) =>
          `"${d.date}","${d.orders}","${d.gross}","${d.discounts}","${d.tax}","${d.net}"`,
      )
      .join('\n');

    return meta + summaryLines + headers + rows + '\n';
  }

  async generateTaxCsv(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const report = await this.taxReport(dispensaryId, startDate, endDate);

    const meta = `"Tax Report: ${report.dispensaryName ?? 'Unknown'}"\n"State: ${report.state ?? ''}"\n"License: ${report.licenseNumber ?? ''}"\n"Period: ${startDate} to ${endDate}"\n"Generated: ${new Date().toISOString()}"\n`;
    const summary = `\n"Taxable Sales","${report.taxableSales}"\n"Discounts","${report.totalDiscounts}"\n"Net Taxable","${report.netTaxable}"\n"Tax Collected","${report.totalTaxCollected}"\n"Transactions","${report.transactionCount}"\n`;

    const headers =
      '\n"Tax Breakdown"\nTax Name,Code,Rate,Basis,Statutory Reference,Estimated Tax\n';
    const rows = report.taxBreakdown
      .map(
        (t) =>
          `"${t.taxName}","${t.taxCode}","${t.rate}","${t.taxBasis}","${t.statutoryReference ?? ''}","${t.estimatedTax}"`,
      )
      .join('\n');

    return meta + summary + headers + rows + '\n';
  }

  async generateStaffCsv(
    dispensaryId: string,
    startDate: string,
    endDate: string,
  ): Promise<string> {
    const dispRows = await rawQuery<DispensaryMetaRow>(
      this.ds,
      `SELECT name FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = dispRows[0];
    const staff = await this.staffPerformance(dispensaryId, startDate, endDate);
    const labor = await this.laborCostSummary(dispensaryId, startDate, endDate);

    const meta = `"Staff Performance: ${disp?.name ?? 'Unknown'}"\n"Period: ${startDate} to ${endDate}"\n"Generated: ${new Date().toISOString()}"\n`;
    const summary = `\n"Labor Cost","${labor.totalLaborCost}"\n"Revenue","${labor.totalRevenue}"\n"Labor %","${labor.laborCostPercent}%"\n`;

    const headers =
      '\nEmployee #,First Name,Last Name,Position,Hours,OT Hours,Shifts,Rate,Labor Cost,Review Rating,Active Certs,Expired Certs\n';
    const rows = staff
      .map((s) =>
        [
          s.employee_number,
          s.firstName,
          s.lastName,
          s.position_name,
          s.total_hours,
          s.overtime_hours,
          s.shifts_worked,
          s.hourly_rate,
          s.labor_cost,
          s.latest_review_rating ?? '-',
          s.active_certs,
          s.expired_certs,
        ]
          .map((v) => `"${v ?? ''}"`)
          .join(','),
      )
      .join('\n');

    return meta + summary + headers + rows + '\n';
  }

  async generateInventoryCsv(dispensaryId: string): Promise<string> {
    const dispRows = await rawQuery<DispensaryMetaRow>(
      this.ds,
      `SELECT name FROM dispensaries WHERE entity_id = $1`,
      [dispensaryId],
    );
    const disp = dispRows[0];
    const items = await this.inventoryValuation(dispensaryId);

    const meta = `"Inventory Valuation: ${disp?.name ?? 'Unknown'}"\n"Generated: ${new Date().toISOString()}"\n`;
    const headers =
      '\nProduct,Variant,SKU,On Hand,Reserved,Available,Unit Price,Total Value,Lot #,Expiration,Last Movement\n';
    const rows = items
      .map((i) =>
        [
          i.product_name,
          i.variant_name,
          i.sku,
          i.quantity_on_hand,
          i.quantity_reserved,
          i.quantity_available,
          i.unit_price,
          i.total_value,
          i.lot_number,
          i.expiration_date instanceof Date
            ? i.expiration_date.toISOString()
            : i.expiration_date,
          i.last_movement_at instanceof Date
            ? i.last_movement_at.toISOString()
            : i.last_movement_at,
        ]
          .map((v) => `"${v == null ? '' : String(v)}"`)
          .join(','),
      )
      .join('\n');

    const totalValue = items.reduce((s, i) => s + toNumber(i.total_value), 0);

    return (
      meta +
      `"Total Inventory Value","${totalValue.toFixed(2)}"\n` +
      headers +
      rows +
      '\n'
    );
  }
}
