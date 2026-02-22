/**
 * @file analytics-summary.ts
 * @package @cannasaas/types
 *
 * Analytics types — mirrors the nightly-aggregated dashboard data from:
 *   GET /analytics/dashboard    (Manager+)
 *   GET /analytics/products     (Manager+)
 *   GET /analytics/customers    (Manager+)
 *   GET /analytics/export       (Admin+)
 *   GET /compliance/analytics/sales
 *   GET /compliance/analytics/revenue
 *   GET /compliance/analytics/top-products
 *
 * Data is aggregated nightly by a cron job and cached in Redis.
 * Real-time updates use WebSocket events for the live order count.
 */

// ── Shared Primitives ─────────────────────────────────────────────────────────

/**
 * A single data point in a time series chart.
 * `label` is displayed on the x-axis (e.g. "Mon", "Feb 22", "Week 8").
 */
export interface TimeSeriesPoint {
  label: string;
  /** ISO 8601 date string for the point (used for tooltip formatting) */
  date: string;
  value: number;
}

/**
 * A metric with its period-over-period percentage change.
 * `change` is positive for growth, negative for decline.
 * e.g. revenue: { value: 125000, change: 15.5 } → "↑ 15.5%"
 */
export interface MetricWithChange {
  value: number;
  /** Percentage change vs. previous period, e.g. 15.5 = +15.5% */
  change: number;
  /** The comparison period, e.g. "vs last 30 days" */
  comparisonLabel?: string;
}

// ── Top Product ───────────────────────────────────────────────────────────────

export interface TopProduct {
  productId: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  revenue: number;
  unitsSold: number;
  /** Average star rating across all reviews */
  averageRating?: number | null;
}

// ── Dashboard Summary ─────────────────────────────────────────────────────────

/**
 * Full response from GET /analytics/dashboard.
 * Drives the admin Analytics Dashboard page stat cards and charts.
 */
export interface AnalyticsSummary {
  dispensaryId: string;
  organizationId: string;

  /** ISO 8601 date range this summary covers */
  period: {
    start: string;
    end: string;
    /** Granularity of the `byDay` arrays */
    granularity: 'day' | 'week' | 'month';
  };

  // ── Revenue ────────────────────────────────────────────────────────────────
  revenue: MetricWithChange & {
    /** Time series — one point per `granularity` unit in the period */
    byDay: TimeSeriesPoint[];
    /** Revenue broken down by product category */
    byCategory: Array<{
      category: string;
      revenue: number;
      percentage: number;
    }>;
    /** Pre-tax subtotal (for compliance reporting) */
    subtotal: number;
    /** Total tax collected */
    taxCollected: number;
  };

  // ── Orders ─────────────────────────────────────────────────────────────────
  orders: MetricWithChange & {
    byDay: TimeSeriesPoint[];
    /** Breakdown by fulfillment method */
    byFulfillment: {
      pickup: number;
      delivery: number;
    };
    /** Breakdown by order status */
    byStatus: Partial<Record<string, number>>;
  };

  // ── Customers ──────────────────────────────────────────────────────────────
  customers: {
    /** Total unique customers in the period */
    total: MetricWithChange;
    /** First-time customers */
    new: MetricWithChange;
    /** Customers with 2+ orders */
    returning: MetricWithChange;
    /** Customer retention rate as a percentage */
    retentionRate: number;
  };

  // ── Average Order Value ────────────────────────────────────────────────────
  avgOrderValue: MetricWithChange & {
    byDay: TimeSeriesPoint[];
  };

  // ── Inventory ──────────────────────────────────────────────────────────────
  inventory: {
    /** Products currently below their low-stock threshold */
    lowStockCount: number;
    /** Products with zero on-hand quantity */
    outOfStockCount: number;
    /** Total inventory value at cost */
    totalValue: number;
  };

  // ── Top Performers ─────────────────────────────────────────────────────────
  topProducts: TopProduct[];

  /** ISO 8601 — when this summary was last computed by the nightly cron */
  computedAt: string;
}

// ── Product Analytics ─────────────────────────────────────────────────────────

/** Response from GET /analytics/products — per-product performance table */
export interface ProductAnalytics {
  productId: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  revenue: number;
  unitsSold: number;
  averageOrderSize: number;
  returnRate: number;
  averageRating?: number | null;
  revenueByDay: TimeSeriesPoint[];
}
