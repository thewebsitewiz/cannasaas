import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getDashboard(dispensaryId: string, days = 30): Promise<any> {
    const [sales, salesTrend, topProducts, categoryBreakdown, inventory, lowStock, metrcSync, compliance] = await Promise.all([
      this.getSalesOverview(dispensaryId, days),
      this.getSalesTrend(dispensaryId, days),
      this.getTopProducts(dispensaryId, days),
      this.getCategoryBreakdown(dispensaryId, days),
      this.getInventoryOverview(dispensaryId),
      this.getLowStockItems(dispensaryId),
      this.getMetrcSyncOverview(dispensaryId),
      this.getComplianceSummary(dispensaryId),
    ]);

    return { sales, salesTrend, topProducts, categoryBreakdown, inventory, lowStockItems: lowStock, metrcSync, compliance };
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  async getSalesOverview(dispensaryId: string, days: number): Promise<any> {
    const [result] = await this.dataSource.query(
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

    return {
      totalRevenue: parseFloat(result.total_revenue),
      totalOrders: parseInt(result.total_orders, 10),
      averageOrderValue: parseFloat(parseFloat(result.average_order_value).toFixed(2)),
      totalTax: parseFloat(result.total_tax),
      totalDiscount: parseFloat(result.total_discount),
      completedOrders: parseInt(result.completed_orders, 10),
      pendingOrders: parseInt(result.pending_orders, 10),
      cancelledOrders: parseInt(result.cancelled_orders, 10),
    };
  }

  async getSalesTrend(dispensaryId: string, days: number): Promise<any[]> {
    const interval = days <= 7 ? 'day' : days <= 30 ? 'day' : 'week';

    const rows = await this.dataSource.query(
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

    return rows.map((r: any) => ({
      period: r.period instanceof Date ? r.period.toISOString().split('T')[0] : String(r.period),
      revenue: parseFloat(r.revenue),
      orders: parseInt(r.orders, 10),
      averageOrderValue: parseFloat(parseFloat(r.average_order_value).toFixed(2)),
    }));
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async getTopProducts(dispensaryId: string, days: number, limit = 10): Promise<any[]> {
    const rows = await this.dataSource.query(
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

    return rows.map((r: any) => ({
      productId: r.product_id,
      productName: r.product_name,
      strainType: r.strain_type,
      unitsSold: parseInt(r.units_sold, 10),
      revenue: parseFloat(r.revenue),
    }));
  }

  async getCategoryBreakdown(dispensaryId: string, days: number): Promise<any[]> {
    const rows = await this.dataSource.query(
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

    return rows.map((r: any) => ({
      category: r.category,
      productCount: parseInt(r.product_count, 10),
      unitsSold: parseInt(r.units_sold, 10),
      revenue: parseFloat(r.revenue),
    }));
  }

  // ── Inventory ─────────────────────────────────────────────────────────────

  async getInventoryOverview(dispensaryId: string): Promise<any> {
    const [result] = await this.dataSource.query(
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

    const [valueResult] = await this.dataSource.query(
      `SELECT COALESCE(SUM(i.quantity_on_hand * pp.price), 0) as est_value
       FROM inventory i
       JOIN product_pricing pp ON pp.variant_id = i.variant_id AND pp.price_type = 'retail'
         AND pp.effective_from <= NOW() AND (pp.effective_until IS NULL OR pp.effective_until > NOW())
       WHERE i.dispensary_id = $1`,
      [dispensaryId],
    );

    return {
      totalVariants: parseInt(result.total_variants, 10),
      totalUnitsOnHand: parseFloat(result.total_on_hand),
      totalUnitsReserved: parseFloat(result.total_reserved),
      totalUnitsAvailable: parseFloat(result.total_available),
      estimatedInventoryValue: parseFloat(valueResult?.est_value ?? 0),
      lowStockCount: parseInt(result.low_stock, 10),
      outOfStockCount: parseInt(result.out_of_stock, 10),
    };
  }

  async getLowStockItems(dispensaryId: string, limit = 20): Promise<any[]> {
    const rows = await this.dataSource.query(
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

    return rows.map((r: any) => ({
      variantId: r.variant_id,
      productName: r.product_name,
      variantName: r.variant_name,
      quantityOnHand: parseFloat(r.quantity_on_hand),
      quantityAvailable: parseFloat(r.quantity_available),
      reorderThreshold: r.reorder_threshold ? parseFloat(r.reorder_threshold) : null,
    }));
  }

  // ── Metrc Sync ────────────────────────────────────────────────────────────

  async getMetrcSyncOverview(dispensaryId: string): Promise<any> {
    const [result] = await this.dataSource.query(
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

    const [orderResult] = await this.dataSource.query(
      `SELECT COUNT(*) as awaiting
       FROM orders
       WHERE "dispensaryId" = $1 AND "orderStatus" = 'completed' AND "metrcSyncStatus" IN ('pending', 'failed')`,
      [dispensaryId],
    );

    const total = parseInt(result.total_syncs, 10);
    const success = parseInt(result.success_count, 10);

    return {
      totalSyncs: total,
      successCount: success,
      failedCount: parseInt(result.failed_count, 10),
      pendingCount: parseInt(result.pending_count, 10),
      successRate: total > 0 ? parseFloat(((success / total) * 100).toFixed(1)) : 100,
      ordersAwaitingSync: parseInt(orderResult.awaiting, 10),
      lastSyncAt: result.last_sync_at ? new Date(result.last_sync_at).toISOString() : null,
    };
  }

  // ── Compliance ────────────────────────────────────────────────────────────

  async getComplianceSummary(dispensaryId: string): Promise<any> {
    const [result] = await this.dataSource.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE metrc_item_uid IS NOT NULL AND metrc_item_category_id IS NOT NULL AND is_approved = true) as compliant,
        COUNT(*) FILTER (WHERE metrc_item_uid IS NULL) as missing_uid,
        COUNT(*) FILTER (WHERE metrc_item_category_id IS NULL) as missing_category
       FROM products
       WHERE dispensary_id = $1 AND is_active = true`,
      [dispensaryId],
    );

    const [labelResult] = await this.dataSource.query(
      `SELECT COUNT(*) as missing_label
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE p.dispensary_id = $1 AND p.is_active = true AND pv.is_active = true AND pv.metrc_package_label IS NULL`,
      [dispensaryId],
    );

    const total = parseInt(result.total, 10);
    const compliant = parseInt(result.compliant, 10);

    return {
      totalProducts: total,
      compliantProducts: compliant,
      missingUid: parseInt(result.missing_uid, 10),
      missingCategory: parseInt(result.missing_category, 10),
      missingPackageLabel: parseInt(labelResult.missing_label, 10),
      compliancePercent: total > 0 ? parseFloat(((compliant / total) * 100).toFixed(1)) : 100,
    };
  }
}
