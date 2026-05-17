import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface VelocityRow {
  totalSold: string | number;
}

interface ReorderRawRow {
  inventoryId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  quantityAvailable: string | number;
  avgDailySales: string | number;
  leadTimeDays: string | number;
  daysOfStockRemaining: string | number;
  suggestedReorderDate: Date | string | null;
  suggestedQuantity: string | number;
}

export interface ReorderSuggestionDto {
  inventoryId: string;
  variantId: string;
  productName: string;
  variantName?: string;
  quantityAvailable: number;
  avgDailySales: number;
  leadTimeDays: number;
  daysOfStockRemaining: number;
  suggestedReorderDate: string | null;
  suggestedQuantity: number;
}

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
export class ReorderSuggestionService {
  private readonly logger = new Logger(ReorderSuggestionService.name);

  constructor(@InjectDataSource() private ds: DataSource) {}

  async getSalesVelocity(
    variantId: string,
    dispensaryId: string,
    days = 30,
  ): Promise<number> {
    const rows = await rawQuery<VelocityRow>(
      this.ds,
      `SELECT COALESCE(SUM(li.quantity), 0) as "totalSold"
       FROM order_line_items li
       JOIN orders o ON o."orderId" = li."orderId"
       JOIN product_variants pv ON pv.product_id = li."productId" AND pv.variant_id = $1
       WHERE o."dispensaryId" = $2 AND o."orderStatus" = 'completed'
         AND o."createdAt" >= NOW() - INTERVAL '1 day' * $3`,
      [variantId, dispensaryId, days],
    );
    const totalSold = toNumber(rows[0]?.totalSold);
    return days > 0 ? totalSold / days : 0;
  }

  async getReorderSuggestions(
    dispensaryId: string,
  ): Promise<ReorderSuggestionDto[]> {
    const rows = await rawQuery<ReorderRawRow>(
      this.ds,
      `WITH sales_30d AS (
        SELECT pv.variant_id,
          COALESCE(SUM(li.quantity), 0) as total_sold,
          COALESCE(SUM(li.quantity), 0) / 30.0 as avg_daily_sales
        FROM product_variants pv
        LEFT JOIN order_line_items li ON li."productId" = pv.product_id
        LEFT JOIN orders o ON o."orderId" = li."orderId"
          AND o."dispensaryId" = $1
          AND o."orderStatus" = 'completed'
          AND o."createdAt" >= NOW() - INTERVAL '30 days'
        WHERE EXISTS (SELECT 1 FROM inventory i WHERE i.variant_id = pv.variant_id AND i.dispensary_id = $1)
        GROUP BY pv.variant_id
      ),
      lead_times AS (
        SELECT pv.variant_id,
          COALESCE(AVG(EXTRACT(EPOCH FROM (po.received_at - po.ordered_at)) / 86400), 7) as avg_lead_time_days
        FROM product_variants pv
        LEFT JOIN purchase_order_items poi ON poi.variant_id = pv.variant_id
        LEFT JOIN purchase_orders po ON po.purchase_order_id = poi.purchase_order_id
          AND po.received_at IS NOT NULL
        WHERE EXISTS (SELECT 1 FROM inventory i WHERE i.variant_id = pv.variant_id AND i.dispensary_id = $1)
        GROUP BY pv.variant_id
      )
      SELECT
        i.inventory_id as "inventoryId",
        i.variant_id as "variantId",
        p.name as "productName",
        pv.name as "variantName",
        i.quantity_available as "quantityAvailable",
        COALESCE(s.avg_daily_sales, 0) as "avgDailySales",
        COALESCE(lt.avg_lead_time_days, 7) as "leadTimeDays",
        CASE
          WHEN COALESCE(s.avg_daily_sales, 0) > 0
          THEN i.quantity_available / s.avg_daily_sales
          ELSE 999
        END as "daysOfStockRemaining",
        CASE
          WHEN COALESCE(s.avg_daily_sales, 0) > 0
          THEN NOW() + (INTERVAL '1 day' * (i.quantity_available / s.avg_daily_sales - COALESCE(lt.avg_lead_time_days, 7)))
          ELSE NULL
        END as "suggestedReorderDate",
        CASE
          WHEN COALESCE(s.avg_daily_sales, 0) > 0
          THEN CEIL(s.avg_daily_sales * COALESCE(lt.avg_lead_time_days, 7) * 2)
          ELSE COALESCE(i.reorder_quantity, 10)
        END as "suggestedQuantity"
      FROM inventory i
      JOIN product_variants pv ON pv.variant_id = i.variant_id
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN sales_30d s ON s.variant_id = i.variant_id
      LEFT JOIN lead_times lt ON lt.variant_id = i.variant_id
      WHERE i.dispensary_id = $1
        AND CASE
          WHEN COALESCE(s.avg_daily_sales, 0) > 0
          THEN (i.quantity_available / s.avg_daily_sales) < (COALESCE(lt.avg_lead_time_days, 7) * 1.5)
          ELSE i.quantity_available <= COALESCE(i.reorder_threshold, 5)
        END
      ORDER BY "daysOfStockRemaining" ASC`,
      [dispensaryId],
    );

    return rows.map((r) => ({
      inventoryId: r.inventoryId,
      variantId: r.variantId,
      productName: r.productName,
      variantName: r.variantName ?? undefined,
      quantityAvailable: toNumber(r.quantityAvailable),
      avgDailySales: parseFloat(toNumber(r.avgDailySales).toFixed(2)),
      leadTimeDays: parseFloat(toNumber(r.leadTimeDays).toFixed(1)),
      daysOfStockRemaining: parseFloat(
        toNumber(r.daysOfStockRemaining).toFixed(1),
      ),
      suggestedReorderDate: r.suggestedReorderDate
        ? new Date(r.suggestedReorderDate).toISOString()
        : null,
      suggestedQuantity: toInt(r.suggestedQuantity),
    }));
  }
}
