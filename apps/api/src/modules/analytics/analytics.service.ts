import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SalesOverview,
  SalesTrend,
  TopProduct,
  CategoryBreakdown,
  InventoryOverview,
  LowStockItem,
  MetrcSyncOverview,
  ComplianceSummary,
  DashboardData,
} from './dto/dashboard.types';

// ── DB row types ──────────────────────────────────────────────────────────

interface SalesOverviewRow {
  total_revenue: string | number;
  total_orders: string | number;
  average_order_value: string | number;
  total_tax: string | number;
  total_discount: string | number;
  completed_orders: string | number;
  pending_orders: string | number;
  cancelled_orders: string | number;
}

interface SalesTrendRow {
  period: string | Date;
  revenue: string | number;
  orders: string | number;
  average_order_value: string | number;
}

interface TopProductRow {
  product_id: string;
  product_name: string;
  strain_type: string | null;
  units_sold: string | number;
  revenue: string | number;
}

interface CategoryBreakdownRow {
  category: string;
  product_count: string | number;
  units_sold: string | number;
  revenue: string | number;
}

interface InventoryOverviewRow {
  total_variants: string | number;
  total_on_hand: string | number;
  total_reserved: string | number;
  total_available: string | number;
  low_stock: string | number;
  out_of_stock: string | number;
}

interface InventoryValueRow {
  est_value: string | number;
}

interface LowStockRow {
  variant_id: string;
  product_name: string;
  variant_name: string;
  quantity_on_hand: string | number;
  quantity_available: string | number;
  reorder_threshold: string | number | null;
}

interface MetrcSyncRow {
  total_syncs: string | number;
  success_count: string | number;
  failed_count: string | number;
  pending_count: string | number;
  last_sync_at: Date | string | null;
}

interface OrderAwaitingRow {
  awaiting: string | number;
}

interface ComplianceProductRow {
  total: string | number;
  compliant: string | number;
  missing_uid: string | number;
  missing_category: string | number;
}

interface ComplianceLabelRow {
  missing_label: string | number;
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
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getDashboard(dispensaryId: string, days = 30): Promise<DashboardData> {
    const [
      sales,
      salesTrend,
      topProducts,
      categoryBreakdown,
      inventory,
      lowStock,
      metrcSync,
      compliance,
    ] = await Promise.all([
      this.getSalesOverview(dispensaryId, days),
      this.getSalesTrend(dispensaryId, days),
      this.getTopProducts(dispensaryId, days),
      this.getCategoryBreakdown(dispensaryId, days),
      this.getInventoryOverview(dispensaryId),
      this.getLowStockItems(dispensaryId),
      this.getMetrcSyncOverview(dispensaryId),
      this.getComplianceSummary(dispensaryId),
    ]);

    return {
      sales,
      salesTrend,
      topProducts,
      categoryBreakdown,
      inventory,
      lowStockItems: lowStock,
      metrcSync,
      compliance,
    };
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  async getSalesOverview(
    dispensaryId: string,
    days: number,
  ): Promise<SalesOverview> {
    const rows = await rawQuery<SalesOverviewRow>(
      this.dataSource,
      `SELECT
        COALESCE(SUM(total), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(total), 0) as average_order_value,
        COALESCE(SUM("taxTotal"), 0) as total_tax,
        COALESCE(SUM("discountTotal"), 0) as total_discount,
        COUNT(*) FILTER (WHERE "orderStatus" = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE "orderStatus" = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE "orderStatus" = 'cancelled') as cancelled_orders
       FROM orders
       WHERE "dispensaryId" = $1 AND "createdAt" >= NOW() - INTERVAL '1 day' * $2`,
      [dispensaryId, days],
    );
    const result = rows[0];

    return {
      totalRevenue: toNumber(result.total_revenue),
      totalOrders: toInt(result.total_orders),
      averageOrderValue: parseFloat(
        toNumber(result.average_order_value).toFixed(2),
      ),
      totalTax: toNumber(result.total_tax),
      totalDiscount: toNumber(result.total_discount),
      completedOrders: toInt(result.completed_orders),
      pendingOrders: toInt(result.pending_orders),
      cancelledOrders: toInt(result.cancelled_orders),
    };
  }

  async getSalesTrend(
    dispensaryId: string,
    days: number,
  ): Promise<SalesTrend[]> {
    const interval = days <= 7 ? 'day' : days <= 30 ? 'day' : 'week';

    const rows = await rawQuery<SalesTrendRow>(
      this.dataSource,
      `SELECT
        date_trunc($3, "createdAt") as period,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(*) as orders,
        COALESCE(AVG(total), 0) as average_order_value
       FROM orders
       WHERE "dispensaryId" = $1 AND "createdAt" >= NOW() - INTERVAL '1 day' * $2
       GROUP BY period
       ORDER BY period ASC`,
      [dispensaryId, days, interval],
    );

    return rows.map((r) => ({
      period:
        r.period instanceof Date
          ? (r.period.toISOString().split('T')[0] ?? '')
          : String(r.period),
      revenue: toNumber(r.revenue),
      orders: toInt(r.orders),
      averageOrderValue: parseFloat(toNumber(r.average_order_value).toFixed(2)),
    }));
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async getTopProducts(
    dispensaryId: string,
    days: number,
    limit = 10,
  ): Promise<TopProduct[]> {
    const rows = await rawQuery<TopProductRow>(
      this.dataSource,
      `SELECT
        p.id as product_id, p.name as product_name, p.strain_type,
        SUM(li.quantity) as units_sold,
        SUM(li."unitPrice" * li.quantity) as revenue
       FROM order_line_items li
       JOIN orders o ON o."orderId" = li."orderId"
       JOIN products p ON p.id = li."productId"
       WHERE o."dispensaryId" = $1 AND o."orderStatus" = 'completed'
         AND o."createdAt" >= NOW() - INTERVAL '1 day' * $2
       GROUP BY p.id, p.name, p.strain_type
       ORDER BY revenue DESC
       LIMIT $3`,
      [dispensaryId, days, limit],
    );

    return rows.map((r) => ({
      productId: r.product_id,
      productName: r.product_name,
      strainType: r.strain_type ?? undefined,
      unitsSold: toInt(r.units_sold),
      revenue: toNumber(r.revenue),
    }));
  }

  async getCategoryBreakdown(
    dispensaryId: string,
    days: number,
  ): Promise<CategoryBreakdown[]> {
    const rows = await rawQuery<CategoryBreakdownRow>(
      this.dataSource,
      `SELECT
        COALESCE(lpt.name, 'Uncategorized') as category,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(li.quantity), 0) as units_sold,
        COALESCE(SUM(li."unitPrice" * li.quantity), 0) as revenue
       FROM products p
       LEFT JOIN lkp_product_types lpt ON lpt.product_type_id = p.product_type_id
       LEFT JOIN order_line_items li ON li."productId" = p.id
       LEFT JOIN orders o ON o."orderId" = li."orderId" AND o."orderStatus" = 'completed'
         AND o."createdAt" >= NOW() - INTERVAL '1 day' * $2
       WHERE p.dispensary_id = $1 AND p.is_active = true
       GROUP BY lpt.name
       ORDER BY revenue DESC`,
      [dispensaryId, days],
    );

    return rows.map((r) => ({
      category: r.category,
      productCount: toInt(r.product_count),
      unitsSold: toInt(r.units_sold),
      revenue: toNumber(r.revenue),
    }));
  }

  // ── Inventory ─────────────────────────────────────────────────────────────

  async getInventoryOverview(dispensaryId: string): Promise<InventoryOverview> {
    const rows = await rawQuery<InventoryOverviewRow>(
      this.dataSource,
      `SELECT
        COUNT(*) as total_variants,
        COALESCE(SUM(i.quantity_on_hand), 0) as total_on_hand,
        COALESCE(SUM(i.quantity_reserved), 0) as total_reserved,
        COALESCE(SUM(i.quantity_available), 0) as total_available,
        COUNT(*) FILTER (WHERE i.quantity_available <= COALESCE(i.reorder_threshold, 5) AND i.quantity_available > 0) as low_stock,
        COUNT(*) FILTER (WHERE i.quantity_available <= 0) as out_of_stock
       FROM inventory i
       WHERE i.dispensary_id = $1`,
      [dispensaryId],
    );
    const result = rows[0];

    const valueRows = await rawQuery<InventoryValueRow>(
      this.dataSource,
      `SELECT COALESCE(SUM(i.quantity_on_hand * pp.price), 0) as est_value
       FROM inventory i
       JOIN product_pricing pp ON pp.variant_id = i.variant_id AND pp.price_type = 'retail'
         AND pp.effective_from <= NOW() AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
       WHERE i.dispensary_id = $1`,
      [dispensaryId],
    );

    return {
      totalVariants: toInt(result.total_variants),
      totalUnitsOnHand: toNumber(result.total_on_hand),
      totalUnitsReserved: toNumber(result.total_reserved),
      totalUnitsAvailable: toNumber(result.total_available),
      estimatedInventoryValue: toNumber(valueRows[0]?.est_value),
      lowStockCount: toInt(result.low_stock),
      outOfStockCount: toInt(result.out_of_stock),
    };
  }

  async getLowStockItems(
    dispensaryId: string,
    limit = 20,
  ): Promise<LowStockItem[]> {
    const rows = await rawQuery<LowStockRow>(
      this.dataSource,
      `SELECT i.variant_id, p.name as product_name, pv.name as variant_name,
        i.quantity_on_hand, i.quantity_available, i.reorder_threshold
       FROM inventory i
       JOIN product_variants pv ON pv.variant_id = i.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE i.dispensary_id = $1
         AND i.quantity_available <= COALESCE(i.reorder_threshold, 5)
       ORDER BY i.quantity_available ASC
       LIMIT $2`,
      [dispensaryId, limit],
    );

    return rows.map((r) => ({
      variantId: r.variant_id,
      productName: r.product_name,
      variantName: r.variant_name,
      quantityOnHand: toNumber(r.quantity_on_hand),
      quantityAvailable: toNumber(r.quantity_available),
      reorderThreshold:
        r.reorder_threshold == null ? undefined : toNumber(r.reorder_threshold),
    }));
  }

  // ── Metrc Sync ────────────────────────────────────────────────────────────

  async getMetrcSyncOverview(dispensaryId: string): Promise<MetrcSyncOverview> {
    const rows = await rawQuery<MetrcSyncRow>(
      this.dataSource,
      `SELECT
        COUNT(*) as total_syncs,
        COUNT(*) FILTER (WHERE status = 'success') as success_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        MAX(updated_at) FILTER (WHERE status = 'success') as last_sync_at
       FROM metrc_sync_logs
       WHERE dispensary_id = $1`,
      [dispensaryId],
    );
    const result = rows[0];

    const orderRows = await rawQuery<OrderAwaitingRow>(
      this.dataSource,
      `SELECT COUNT(*) as awaiting
       FROM orders
       WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed' AND "metrcSyncStatus" IN ('pending', 'failed')`,
      [dispensaryId],
    );

    const total = toInt(result.total_syncs);
    const success = toInt(result.success_count);

    return {
      totalSyncs: total,
      successCount: success,
      failedCount: toInt(result.failed_count),
      pendingCount: toInt(result.pending_count),
      successRate:
        total > 0 ? parseFloat(((success / total) * 100).toFixed(1)) : 100,
      ordersAwaitingSync: toInt(orderRows[0]?.awaiting),
      lastSyncAt: result.last_sync_at
        ? new Date(result.last_sync_at).toISOString()
        : undefined,
    };
  }

  // ── Compliance ────────────────────────────────────────────────────────────

  async getComplianceSummary(dispensaryId: string): Promise<ComplianceSummary> {
    const rows = await rawQuery<ComplianceProductRow>(
      this.dataSource,
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE metrc_item_uid IS NOT NULL AND metrc_item_category_id IS NOT NULL AND is_approved = true) as compliant,
        COUNT(*) FILTER (WHERE metrc_item_uid IS NULL) as missing_uid,
        COUNT(*) FILTER (WHERE metrc_item_category_id IS NULL) as missing_category
       FROM products
       WHERE dispensary_id = $1 AND is_active = true`,
      [dispensaryId],
    );
    const result = rows[0];

    const labelRows = await rawQuery<ComplianceLabelRow>(
      this.dataSource,
      `SELECT COUNT(*) as missing_label
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.dispensary_id = $1 AND p.is_active = true AND pv.is_active = true AND pv.metrc_package_label IS NULL`,
      [dispensaryId],
    );

    const total = toInt(result.total);
    const compliant = toInt(result.compliant);

    return {
      totalProducts: total,
      compliantProducts: compliant,
      missingUid: toInt(result.missing_uid),
      missingCategory: toInt(result.missing_category),
      missingPackageLabel: toInt(labelRows[0]?.missing_label),
      compliancePercent:
        total > 0 ? parseFloat(((compliant / total) * 100).toFixed(1)) : 100,
    };
  }
}
