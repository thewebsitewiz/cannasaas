import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { OrderEvent } from './events/order-event';
import { StockEventEmitterService } from '../inventory/stock-event-emitter.service';
import type { StockChangeSource } from '../inventory/stock-events';
import {
  ORDER_CREATED,
  ORDER_STATUS_CHANGED,
} from '../../common/events/event-names';

/**
 * Inventory `UPDATE … RETURNING` row shape, shared between the order
 * creator (reserve path) and state machine (cancel/release path).
 */
export interface ReserveReturningRow {
  inventory_id: string;
  variant_id: string;
  new_available: string;
  prev_available: string;
  reorder_threshold: string | null;
}

/**
 * Row shape projected from `orders` for the order-event emitter.
 */
export interface OrderEventRow {
  customerUserId: string | null;
  orderType: string;
  total: string | null;
}

/**
 * Maps product_type codes to the per_mg_thc tax code suffix.
 * FLOWER / PRE_ROLL -> FLOWER, VAPE / CONCENTRATE -> CONCENTRATE,
 * EDIBLE / BEVERAGE / TINCTURE / CAPSULE -> EDIBLE.
 * Products that don't match (TOPICAL, ACCESSORY, HEMP_CBD) are not
 * subject to per-mg-THC excise — those rules will simply be skipped.
 */
export const THC_TAX_CATEGORY_MAP: Record<string, string> = {
  FLOWER: 'FLOWER',
  PRE_ROLL: 'FLOWER',
  VAPE: 'CONCENTRATE',
  CONCENTRATE: 'CONCENTRATE',
  EDIBLE: 'EDIBLE',
  BEVERAGE: 'EDIBLE',
  TINCTURE: 'EDIBLE',
  CAPSULE: 'EDIBLE',
  SUPPOSITORY: 'EDIBLE',
  PATCH: 'EDIBLE',
};

/**
 * Typed wrapper around `QueryRunner.query` — TypeORM declares it as
 * `Promise<any>` (no generic), so without a wrapper every awaited row
 * is `any` and trips no-unsafe-assignment. DataSource.query, in contrast,
 * IS generic (`query<T = any>`) so a typed variable annotation on those
 * call sites infers T contextually and lints clean.
 */
export async function runnerQuery<T>(
  qr: QueryRunner,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const rows: unknown = await qr.query(sql, params);
  return rows as T[];
}

/**
 * Narrows the loose return of `DataSource.query(...)` for DML statements into
 * a row count. node-postgres returns `{ rowCount, command, oid, fields, rows }`
 * but some adapters historically returned `[rows, rowCount]`. This handles
 * both and falls back to 0.
 */
export function dmlRowCount(result: unknown): number {
  if (Array.isArray(result)) {
    const second: unknown = result[1];
    return typeof second === 'number' ? second : 0;
  }
  if (result !== null && typeof result === 'object' && 'rowCount' in result) {
    const rc = (result as { rowCount?: unknown }).rowCount;
    return typeof rc === 'number' ? rc : 0;
  }
  return 0;
}

/**
 * Fetches order context and emits an OrderEvent. Notifications are
 * handled downstream by the NotificationService listener. Extracted
 * from the original `OrdersService` so the creator + state-machine
 * services share one implementation.
 */
@Injectable()
export class OrderEventEmitterService {
  private readonly logger = new Logger(OrderEventEmitterService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async emit(
    orderId: string,
    dispensaryId: string,
    status: string,
  ): Promise<void> {
    try {
      const rows: OrderEventRow[] = await this.dataSource.query(
        `SELECT customer_user_id AS "customerUserId", order_type AS "orderType", total
         FROM orders WHERE order_id = $1`,
        [orderId],
      );
      const order = rows[0];
      if (!order) return;
      this.eventEmitter.emit(
        status === 'pending' ? ORDER_CREATED : ORDER_STATUS_CHANGED,
        new OrderEvent(
          orderId,
          dispensaryId,
          status,
          order.customerUserId,
          order.orderType,
          order.total ? parseFloat(order.total) : null,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to emit order event: ${message}`);
    }
  }
}

/**
 * Translates a batch of inventory `UPDATE … RETURNING` rows into
 * `StockEventEmitterService.recordChange` calls. Used by the order
 * reserve / cancel paths so customer orders flow through the same
 * event pipeline as manual adjustments (sc-113). Emitting happens
 * post-commit; a failure to emit never rolls back the order.
 */
@Injectable()
export class OrderStockEventBridgeService {
  private readonly logger = new Logger(OrderStockEventBridgeService.name);

  constructor(private readonly stockEvents: StockEventEmitterService) {}

  async emit(
    rows: ReserveReturningRow[],
    dispensaryId: string,
    source: StockChangeSource,
  ): Promise<void> {
    for (const row of rows) {
      try {
        await this.stockEvents.recordChange({
          dispensaryId,
          inventoryId: row.inventory_id,
          variantId: row.variant_id,
          previousAvailable: Number(row.prev_available),
          newAvailable: Number(row.new_available),
          reorderThreshold:
            row.reorder_threshold != null
              ? Number(row.reorder_threshold)
              : null,
          source,
        });
      } catch (err) {
        this.logger.warn(
          `emitStockChanges: recordChange failed for variant=${row.variant_id}: ${
            err instanceof Error ? err.message : 'unknown'
          }`,
        );
      }
    }
  }
}
