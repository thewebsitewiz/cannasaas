import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { StockEventEmitterService } from './stock-event-emitter.service';

// ── DB row types ──────────────────────────────────────────────────────────

export interface InventoryRow {
  inventoryId: string;
  variantId: string;
  dispensaryId: string;
  quantityOnHand: string | number;
  quantityReserved: string | number;
  quantityAvailable: string | number;
  reorderThreshold: string | number | null;
  reorderQuantity: string | number | null;
  locationInStore: string | null;
  lastMetrcSyncAt?: Date | string | null;
  lastReconciledAt?: Date | string | null;
  lastCountAt?: Date | string | null;
  lastCountByUserId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface InventoryUpdatedRow {
  inventory_id: string;
  variant_id: string;
  dispensary_id: string;
  quantity_on_hand: string | number;
  quantity_reserved: string | number;
  quantity_available: string | number;
}

interface InventoryReleaseRow extends InventoryUpdatedRow {
  release_qty: string | number;
  prev_available: string | number;
}

interface InventoryExistsRow {
  inventory_id?: string;
  quantity_available?: string | number;
}

interface InventoryTxRow {
  transactionId: string;
  inventoryId: string;
  dispensaryId: string;
  transactionType: string;
  quantityDelta: string | number;
  quantityBefore: string | number;
  quantityAfter: string | number;
  referenceOrderId: string | null;
  performedByUserId: string | null;
  notes: string | null;
  createdAt: Date | string;
}

interface LowStockRow {
  inventoryId: string;
  variantId: string;
  quantityOnHand: string | number;
  quantityAvailable: string | number;
  reorderThreshold: string | number | null;
  reorderQuantity: string | number | null;
  locationInStore: string | null;
}

interface InventoryValueRow {
  totalItems: string | number;
  totalOnHand: string | number;
  totalReserved: string | number;
  totalAvailable: string | number;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface InventoryAdjustResult {
  inventory: InventoryRow;
  transaction: InventoryTxRow;
}

export interface InventoryValueDto {
  totalItems: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
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
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectDataSource() private ds: DataSource,
    private readonly stockEvents: StockEventEmitterService,
  ) {}

  // ═══ READ ═══

  async findById(inventoryId: string): Promise<InventoryRow> {
    const rows = await rawQuery<InventoryRow>(
      this.ds,
      `SELECT inventory_id as "inventoryId", variant_id as "variantId", dispensary_id as "dispensaryId",
        quantity_on_hand as "quantityOnHand", quantity_reserved as "quantityReserved",
        quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", reorder_quantity as "reorderQuantity",
        location_in_store as "locationInStore",
        last_metrc_sync_at as "lastMetrcSyncAt", last_reconciled_at as "lastReconciledAt",
        last_count_at as "lastCountAt", last_count_by_user_id as "lastCountByUserId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM inventory WHERE inventory_id = $1`,
      [inventoryId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('Inventory record not found');
    return row;
  }

  async getByDispensary(
    dispensaryId: string,
    limit = 100,
    offset = 0,
  ): Promise<InventoryRow[]> {
    return rawQuery<InventoryRow>(
      this.ds,
      `SELECT inventory_id as "inventoryId", variant_id as "variantId", dispensary_id as "dispensaryId",
        quantity_on_hand as "quantityOnHand", quantity_reserved as "quantityReserved",
        quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", location_in_store as "locationInStore",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM inventory WHERE dispensary_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [dispensaryId, limit, offset],
    );
  }

  async getByVariant(
    variantId: string,
    dispensaryId: string,
  ): Promise<InventoryRow | null> {
    const rows = await rawQuery<InventoryRow>(
      this.ds,
      `SELECT inventory_id as "inventoryId", variant_id as "variantId", dispensary_id as "dispensaryId",
        quantity_on_hand as "quantityOnHand", quantity_reserved as "quantityReserved",
        quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", reorder_quantity as "reorderQuantity",
        location_in_store as "locationInStore",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM inventory WHERE variant_id = $1 AND dispensary_id = $2`,
      [variantId, dispensaryId],
    );
    return rows[0] ?? null;
  }

  // ═══ ADJUST ═══

  async adjustQuantity(
    inventoryId: string,
    delta: number,
    transactionType: string,
    performedByUserId: string,
    notes?: string,
    referenceOrderId?: string,
  ): Promise<InventoryAdjustResult> {
    // Single UPDATE ... RETURNING * instead of SELECT + UPDATE (N+1 fix)
    const updated = await rawQuery<InventoryUpdatedRow>(
      this.ds,
      `UPDATE inventory
       SET quantity_on_hand = quantity_on_hand + $2,
           quantity_available = quantity_available + $2,
           updated_at = NOW()
       WHERE inventory_id = $1 AND quantity_on_hand + $2 >= 0
       RETURNING *`,
      [inventoryId, delta],
    );
    const inv = updated[0];
    if (!inv) {
      const exists = await rawQuery<InventoryExistsRow>(
        this.ds,
        'SELECT 1 FROM inventory WHERE inventory_id = $1',
        [inventoryId],
      );
      if (exists.length === 0)
        throw new NotFoundException('Inventory record not found');
      throw new BadRequestException(
        'Adjustment would result in negative quantity',
      );
    }

    const before = toNumber(inv.quantity_on_hand) - delta;
    const after = toNumber(inv.quantity_on_hand);

    const txRows = await rawQuery<InventoryTxRow>(
      this.ds,
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, notes, reference_order_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        inventoryId,
        inv.dispensary_id,
        transactionType,
        delta,
        before,
        after,
        performedByUserId,
        notes ?? null,
        referenceOrderId ?? null,
      ],
    );

    this.logger.log(
      'Inventory adjusted: ' +
        inventoryId +
        ' delta=' +
        String(delta) +
        ' (' +
        transactionType +
        ')',
    );
    const inventoryRow = await this.findById(inventoryId);
    await this.stockEvents.recordChange({
      dispensaryId: inv.dispensary_id,
      inventoryId,
      variantId: inv.variant_id,
      previousAvailable: toNumber(inv.quantity_available) - delta,
      newAvailable: toNumber(inv.quantity_available),
      reorderThreshold:
        inventoryRow.reorderThreshold != null
          ? toNumber(inventoryRow.reorderThreshold)
          : null,
      source: 'adjustment',
    });
    return {
      inventory: inventoryRow,
      transaction: txRows[0],
    };
  }

  async reserveStock(
    inventoryId: string,
    quantity: number,
    performedByUserId: string,
    referenceOrderId?: string,
  ): Promise<InventoryAdjustResult> {
    const updated = await rawQuery<InventoryUpdatedRow>(
      this.ds,
      `UPDATE inventory
       SET quantity_reserved = quantity_reserved + $2,
           quantity_available = quantity_available - $2,
           updated_at = NOW()
       WHERE inventory_id = $1 AND quantity_available >= $2
       RETURNING *`,
      [inventoryId, quantity],
    );
    const inv = updated[0];
    if (!inv) {
      const exists = await rawQuery<InventoryExistsRow>(
        this.ds,
        'SELECT inventory_id, quantity_available FROM inventory WHERE inventory_id = $1',
        [inventoryId],
      );
      const existing = exists[0];
      if (!existing) throw new NotFoundException('Inventory record not found');
      throw new BadRequestException(
        'Not enough available stock. Available: ' +
          String(existing.quantity_available) +
          ', requested: ' +
          String(quantity),
      );
    }

    const previousAvailable = toNumber(inv.quantity_available) + quantity;
    const newAvailable = toNumber(inv.quantity_available);

    const txRows = await rawQuery<InventoryTxRow>(
      this.ds,
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, reference_order_id, notes)
      VALUES ($1,$2,'reserve',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        inventoryId,
        inv.dispensary_id,
        -quantity,
        previousAvailable,
        newAvailable,
        performedByUserId,
        referenceOrderId ?? null,
        'Reserved ' + String(quantity) + ' units',
      ],
    );

    this.logger.log(
      'Stock reserved: ' + inventoryId + ' qty=' + String(quantity),
    );
    const inventoryRow = await this.findById(inventoryId);
    await this.stockEvents.recordChange({
      dispensaryId: inv.dispensary_id,
      inventoryId,
      variantId: inv.variant_id,
      previousAvailable,
      newAvailable,
      reorderThreshold:
        inventoryRow.reorderThreshold != null
          ? toNumber(inventoryRow.reorderThreshold)
          : null,
      source: 'reserve',
    });
    return {
      inventory: inventoryRow,
      transaction: txRows[0],
    };
  }

  async releaseReserve(
    inventoryId: string,
    quantity: number,
    performedByUserId: string,
    referenceOrderId?: string,
  ): Promise<InventoryAdjustResult> {
    // Single UPDATE ... RETURNING * with LEAST() to cap release atomically
    const updated = await rawQuery<InventoryReleaseRow>(
      this.ds,
      `WITH pre AS (
        SELECT inventory_id, dispensary_id, quantity_reserved, quantity_available,
               LEAST($2, quantity_reserved) AS release_qty
        FROM inventory WHERE inventory_id = $1
      )
      UPDATE inventory i
       SET quantity_reserved = i.quantity_reserved - pre.release_qty,
           quantity_available = i.quantity_available + pre.release_qty,
           updated_at = NOW()
       FROM pre
       WHERE i.inventory_id = pre.inventory_id
       RETURNING i.*, pre.release_qty, pre.quantity_available AS prev_available`,
      [inventoryId, quantity],
    );
    const inv = updated[0];
    if (!inv) throw new NotFoundException('Inventory record not found');

    const release = toNumber(inv.release_qty);
    const previousAvailable = toNumber(inv.prev_available);
    const newAvailable = toNumber(inv.quantity_available);

    const txRows = await rawQuery<InventoryTxRow>(
      this.ds,
      `INSERT INTO inventory_transactions (inventory_id, dispensary_id, transaction_type, quantity_delta, quantity_before, quantity_after, performed_by_user_id, reference_order_id, notes)
      VALUES ($1,$2,'release',$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        inventoryId,
        inv.dispensary_id,
        release,
        previousAvailable,
        newAvailable,
        performedByUserId,
        referenceOrderId ?? null,
        'Released ' + String(release) + ' reserved units',
      ],
    );

    this.logger.log(
      'Reserve released: ' + inventoryId + ' qty=' + String(release),
    );
    const inventoryRow = await this.findById(inventoryId);
    await this.stockEvents.recordChange({
      dispensaryId: inv.dispensary_id,
      inventoryId,
      variantId: inv.variant_id,
      previousAvailable,
      newAvailable,
      reorderThreshold:
        inventoryRow.reorderThreshold != null
          ? toNumber(inventoryRow.reorderThreshold)
          : null,
      source: 'release',
    });
    return {
      inventory: inventoryRow,
      transaction: txRows[0],
    };
  }

  // ═══ REPORTS ═══

  async getLowStock(dispensaryId: string): Promise<LowStockRow[]> {
    return rawQuery<LowStockRow>(
      this.ds,
      `SELECT inventory_id as "inventoryId", variant_id as "variantId",
        quantity_on_hand as "quantityOnHand", quantity_available as "quantityAvailable",
        reorder_threshold as "reorderThreshold", reorder_quantity as "reorderQuantity",
        location_in_store as "locationInStore"
      FROM inventory
      WHERE dispensary_id = $1 AND reorder_threshold IS NOT NULL AND quantity_available <= reorder_threshold
      ORDER BY quantity_available ASC`,
      [dispensaryId],
    );
  }

  async getInventoryValue(dispensaryId: string): Promise<InventoryValueDto> {
    const rows = await rawQuery<InventoryValueRow>(
      this.ds,
      `SELECT COUNT(*) as "totalItems",
        COALESCE(SUM(quantity_on_hand), 0) as "totalOnHand",
        COALESCE(SUM(quantity_reserved), 0) as "totalReserved",
        COALESCE(SUM(quantity_available), 0) as "totalAvailable"
      FROM inventory WHERE dispensary_id = $1`,
      [dispensaryId],
    );
    const result = rows[0];
    return {
      totalItems: toInt(result.totalItems),
      totalOnHand: toNumber(result.totalOnHand),
      totalReserved: toNumber(result.totalReserved),
      totalAvailable: toNumber(result.totalAvailable),
    };
  }

  async getTransactions(
    inventoryId: string,
    limit = 50,
  ): Promise<InventoryTxRow[]> {
    return rawQuery<InventoryTxRow>(
      this.ds,
      `SELECT transaction_id as "transactionId", inventory_id as "inventoryId",
        dispensary_id as "dispensaryId", transaction_type as "transactionType",
        quantity_delta as "quantityDelta", quantity_before as "quantityBefore", quantity_after as "quantityAfter",
        reference_order_id as "referenceOrderId", performed_by_user_id as "performedByUserId",
        notes, created_at as "createdAt"
      FROM inventory_transactions WHERE inventory_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [inventoryId, limit],
    );
  }
}
