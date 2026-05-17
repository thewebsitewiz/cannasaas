import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  computeStockStatus,
  LowStockEvent,
  STOCK_CHANGED_EVENT,
  STOCK_LOW_EVENT,
  STOCK_OUT_EVENT,
  StockChangeSource,
  StockChangedEvent,
} from './stock-events';

interface ProductNameRow {
  readonly name?: string;
}

interface RecordChangeArgs {
  readonly dispensaryId: string;
  readonly inventoryId: string;
  readonly variantId: string;
  readonly previousAvailable: number;
  readonly newAvailable: number;
  readonly reorderThreshold: number | null;
  readonly source: StockChangeSource;
}

/**
 * Sole emitter for inventory stock-level events. Called from every
 * InventoryService mutation. Computes status crossover and emits the
 * shaped events on EventEmitter2 for downstream consumers (WS gateway,
 * notifications, audit).
 */
@Injectable()
export class StockEventEmitterService {
  private readonly logger = new Logger(StockEventEmitterService.name);

  constructor(
    private readonly events: EventEmitter2,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  async recordChange(args: RecordChangeArgs): Promise<void> {
    const status = computeStockStatus(args.newAvailable, args.reorderThreshold);
    const previousStatus = computeStockStatus(
      args.previousAvailable,
      args.reorderThreshold,
    );

    const productName = await this.lookupProductName(args.variantId);

    const changed: StockChangedEvent = {
      dispensaryId: args.dispensaryId,
      inventoryId: args.inventoryId,
      variantId: args.variantId,
      productName,
      previousAvailable: args.previousAvailable,
      newAvailable: args.newAvailable,
      reorderThreshold: args.reorderThreshold,
      status,
      source: args.source,
    };
    this.events.emit(STOCK_CHANGED_EVENT, changed);

    if (previousStatus === status) return;

    const lowPayload: LowStockEvent = {
      dispensaryId: args.dispensaryId,
      productName,
      quantity: args.newAvailable,
    };
    if (status === 'low_stock') {
      this.events.emit(STOCK_LOW_EVENT, lowPayload);
    } else if (status === 'out_of_stock') {
      this.events.emit(STOCK_OUT_EVENT, lowPayload);
    }
  }

  private async lookupProductName(variantId: string): Promise<string> {
    try {
      const rows = (await this.ds.query(
        `SELECT p.name FROM products p
         JOIN product_variants v ON v.product_id = p.id
         WHERE v.variant_id = $1
         LIMIT 1`,
        [variantId],
      )) as unknown as ProductNameRow[];
      return rows[0]?.name ?? 'Unknown product';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.warn(
        `lookupProductName failed for variant=${variantId}: ${message}`,
      );
      return 'Unknown product';
    }
  }
}
